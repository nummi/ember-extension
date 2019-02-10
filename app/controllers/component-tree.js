import { get, computed, observer } from "@ember/object";
import Controller, { inject as controller } from "@ember/controller";
import searchMatch from "ember-inspector/utils/search-match";
import idFromView from "ember-inspector/libs/id-from-view";
import { notEmpty } from "@ember/object/computed";
import { isEmpty } from "@ember/utils";

import { schedule } from "@ember/runloop";

import ComponentViewItem from "ember-inspector/models/component-view-item";

const buildObjectIdList = function(children, list) {
  children.forEach(function(child) {
    if (child.children.length) {
      list.push(child.value.objectId);
      buildObjectIdList(child.children, list);
    }
  });
};

/**
 * Takes the `viewTree` from `view-debug`'s `sendTree()` method, and recursively
 * flattens it into an array of `ComponentViewItem` objects
 * @param {string} searchValue The value of the search box
 * @param {*} treeNode The node in the viewTree
 * @param {ComponentViewItem} parent The parent `ComponentViewItem`
 * @param {number} parentCount The component hierarchy depth
 * @param {Array<ComponentViewItem>} list The accumulator, gets mutated in each call
 */
const flattenSearchTree = (
  searchValue,
  treeNode,
  parent,
  parentCount,
  list
) => {
  let activeSearch = !isEmpty(searchValue);
  let searchMatched = activeSearch
    ? searchMatch(get(treeNode, "value.name"), searchValue)
    : true;

  let viewItem = ComponentViewItem.create({
    view: treeNode.value,
    parent,
    parentCount,
    searchMatched,
    activeSearch,
    expanded: !activeSearch,
    hasChildren: treeNode.children.length > 0,
    children: treeNode.children
  });

  list.push(viewItem);

  let newParentCount = parentCount + 1;

  treeNode.children.forEach(child => {
    flattenSearchTree(searchValue, child, viewItem, newParentCount, list);
  });
  return list;
};

export default Controller.extend({
  application: controller(),
  queryParams: ["pinnedObjectId"],

  /**
   * The entry in the component tree corresponding to the pinnedObjectId
   * will be selected
   */
  pinnedObjectId: null,
  inspectingViews: false,
  components: true,
  viewTreeLoaded: false,

  /**
   * Bound to the search field to filter the component list.
   *
   * @property searchValue
   * @type {String}
   * @default ''
   */
  searchValue: "",

  activeSearch: notEmpty("searchValue"),

  searchResults: computed("viewArray.[]", "searchValue", function() {
    const search = this.get("searchValue");
    if (isEmpty(search)) {
      return [];
    }

    return this.get("viewArray").filter(function(item) {
      return item.view.name.match(search);
    });
  }),

  /**
   * Index of currently highlighted item in searchResults
   *
   * @property searchResultsIndex
   * @type {Number}
   * @default 0
   */
  searchResultsIndex: 0,
  resetIndexOnSearch: observer(
    "searchValue",
    "currentHighlightedObjectId",
    function() {
      if (this.get("currentHighlightedObjectId")) {
        return;
      }
      /*
      if currentHighlightedObjectId in searchResults, bounce
    */
      this.set("searchResultsIndex", 0);
    }
  ),

  currentHighlightedObjectId: computed(
    "searchResultsIndex",
    "searchResults.[]",
    function() {
      if (!this.get("searchResults").length) {
        return null;
      }
      return idFromView(
        this.get("searchResults")[this.get("searchResultsIndex")]
      );
    }
  ),

  scroll: observer("currentHighlightedObjectId", function() {
    const id = this.get("currentHighlightedObjectId");
    if (id) {
      this.expandToNode(id);
      this.scrollTreeToItem(id);
    }
  }),

  /**
   * The final list that the `{{vertical-collection}}` renders
   * is created in three stages:
   * 1. The `viewArray` is recalculated When the controller's `viewTree` is set by the route, or when
   *    a user updates the search box.
   * 2. The `filteredArray` CP takes the `viewArray` and caches the expanded state for each item.
   *    This keeps the tree from suddenly re-expanding if the `viewTree` updates after users have
   *    collapsed some nodes.
   * 3. Once the list is rendered, when users expand/collapse a node that action directly
   *    toggles the `expanded` property on each item, which makes `visible` recompute.
   *
   * This could probably happen in one big function, but for the time being its split in the
   * interest of clarity rather than performance (even if the extra CPs might avoid doing some extra
   * work when users expand/contract tree nodes)
   */
  displayedList: computed("filteredArray.@each.visible", function() {
    return this.get("filteredArray").filterBy("visible");
  }),

  filteredArray: computed("viewArray.[]", function() {
    let viewArray = this.get("viewArray");
    let expandedStateCache = this.get("expandedStateCache");
    viewArray.forEach(viewItem => {
      let cachedExpansion = expandedStateCache[idFromView(viewItem)];
      if (cachedExpansion !== undefined) {
        viewItem.set("expanded", cachedExpansion);
      } else {
        expandedStateCache[idFromView(viewItem)] = viewItem.expanded;
      }
    });

    return viewArray;
  }),

  viewArray: computed("viewTree", "searchValue", function() {
    let tree = this.get("viewTree");
    if (!tree) {
      return [];
    }
    return flattenSearchTree(this.get("searchValue"), tree, null, 0, []);
  }),

  expandedStateCache: null, //set on init

  init() {
    this._super(...arguments);
    this.set("expandedStateCache", {});
    this.options = {
      components: true
    };
  },

  stepHighlightedItem(direction = "next") {
    const currentId = this.get("currentHighlightedObjectId");
    const searchResults = this.get("searchResults");

    const index = searchResults
      .map(function(r) {
        return idFromView(r);
      })
      .indexOf(currentId);
    const endOfList = index === searchResults.length - 1;
    const startOfList = index === 0;

    let nextIndex = index + 1;

    if (index === -1) {
      nextIndex = 0;
    } else if (direction === "next" && endOfList) {
      nextIndex = 0;
    } else if (direction === "next" && !endOfList) {
      nextIndex = index + 1;
    } else if (direction === "prev" && startOfList) {
      nextIndex = searchResults.length - 1;
    } else if (direction === "prev" && !startOfList) {
      nextIndex = index - 1;
    }

    this.set("searchResultsIndex", nextIndex);
  },

  /**
   * Expands the component tree so that entry for the given view will
   * be shown.  Recursively expands the entry's parents up to the root.
   * @param {*} objectId The id of the ember view to show
   */
  expandToNode(objectId) {
    let node = this.get("filteredArray").find(
      item => item.get("id") === objectId
    );
    if (node) {
      node.expandParents();
    }
  },

  /**
   * This method is basically a trick to get the `{{vertical-collection}}` in the vicinity
   * of the item that's been selected.  We can't directly scroll to the element but we
   * can guess at how far down the list the item is. Then we can manually set the scrollTop
   * of the virtual scroll.
   */
  scrollTreeToItem(objectId) {
    let selectedItemIndex = this.get("displayedList").findIndex(
      item => item.view.objectId === objectId
    );

    if (!selectedItemIndex) {
      return;
    }

    const averageItemHeight = 25;
    const targetScrollTop = averageItemHeight * selectedItemIndex;
    const componentTreeEl = document.querySelector(".js-component-tree");
    const height = componentTreeEl.offsetHeight;

    // Only scroll to item if not already in view
    if (
      targetScrollTop < componentTreeEl.scrollTop ||
      targetScrollTop > componentTreeEl.scrollTop + height
    ) {
      schedule("afterRender", () => {
        componentTreeEl.scrollTop = targetScrollTop - height / 2;
      });
    }
  },

  /**
   * @param {array} objects Array of objectids
   * @param {boolean} state expanded state for objects
   */
  setExpandedStateForObjects(objects, state) {
    this.get("filteredArray").forEach(item => {
      const id = idFromView(item);
      if (objects.includes(id)) {
        item.set("expanded", state);
        this.expandedStateCache[id] = state;
      }
    });
  },

  /**
   * Builds array of objectids and the expanded state they should be set to
   * @param {ComponentViewItem} item
   */
  toggleWithChildren(item) {
    const newState = !item.get("expanded");
    const list = [];
    const clickedId = idFromView(item);

    list.push(clickedId);
    buildObjectIdList(item.children, list);
    this.setExpandedStateForObjects(list, newState);
  },

  actions: {
    nextSearchItem() {
      this.stepHighlightedItem("next");
    },
    previousSearchItem() {
      this.stepHighlightedItem("prev");
    },
    previewLayer({ view: { objectId, elementId, renderNodeId } }) {
      // We are passing all of objectId, elementId, and renderNodeId to support post-glimmer 1, post-glimmer 2, and root for
      // post-glimmer 2
      this.get("port").send("view:previewLayer", {
        objectId,
        renderNodeId,
        elementId
      });
    },

    hidePreview() {
      this.get("port").send("view:hidePreview");
    },

    toggleViewInspection() {
      this.get("port").send("view:inspectViews", {
        inspect: !this.get("inspectingViews")
      });
    },

    sendObjectToConsole(objectId) {
      this.get("port").send("objectInspector:sendToConsole", {
        objectId
      });
    },

    /**
     * Expand or collapse all component nodes
     * @param {Boolean} expanded If true, expanded, if false, collapsed
     */
    expandOrCollapseAll(expanded) {
      this.expandedStateCache = {};
      this.get("filteredArray").forEach(item => {
        item.set("expanded", expanded);
        this.expandedStateCache[idFromView(item)] = expanded;
      });
    },

    toggleExpanded(item, toggleChildren) {
      if (toggleChildren) {
        this.toggleWithChildren(item);
      } else {
        item.toggleProperty("expanded");
        this.expandedStateCache[idFromView(item)] = item.get("expanded");
      }
    },

    inspect(objectId) {
      if (objectId) {
        this.set("pinnedObjectId", objectId);
        this.expandToNode(objectId);
        this.scrollTreeToItem(objectId);
        this.get("port").send("objectInspector:inspectById", {
          objectId
        });
      }
    },

    /**
     * Scrolls the main page to put the selected element into view
     */
    scrollToElement(elementId) {
      this.get("port").send("view:scrollToElement", {
        elementId
      });
    },

    inspectElement(item) {
      let elementId;
      let objectId = item.get("view.objectId");

      if (!objectId) {
        elementId = item.get("view.elementId");
      }
      if (objectId || elementId) {
        this.get("port").send("view:inspectElement", {
          objectId,
          elementId
        });
      }
    }
  }
});
