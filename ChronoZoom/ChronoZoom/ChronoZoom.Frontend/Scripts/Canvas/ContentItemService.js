﻿var Canvas;
(function (Canvas) {
    (function (ContentItemService) {
        // Public methods
        ContentItemService.addListener = addListener;
        ContentItemService.getContentItems = getContentItems;
        ContentItemService.findTimeline = findTimeline;
        ContentItemService.findContentItemsByParentContent = findContentItemsByParentContent;
        
        // Private fields
        var _contentItems = [];
        var _contentItemChangedEvent;
        var _cache = undefined;
        var _timelineID;

        // Constructor
        function initialize() {
            // Create the content item changed event.
            _contentItemChangedEvent = document.createEvent('Event');
            _contentItemChangedEvent.initEvent('contentItemChanged', true, true);

            if (typeof (Storage) !== "undefined") {
                _cache = window.sessionStorage;
            }
            _cache.clear();
        }

        // Add listener
        function addListener(onContentItemChanged) {
            document.addEventListener('contentItemChanged', onContentItemChanged, false);
        }

        // Get content items
        function getContentItems() {
            return _contentItems;
        }

        // Set content items
        function setContentItems(contentItems) {
            _contentItems = contentItems;
            document.dispatchEvent(_contentItemChangedEvent);
        }

        // Find content items by parent content
        function findContentItemsByParentContent(parentContentItem) {
            // Set breadcrumb
            Canvas.Breadcrumbs.setContentItem(parentContentItem);

            // Clear children
            parentContentItem.clearChildren();

            // Get cached data
            var cachedData = getContentItemsFromCache(parentContentItem);
            if (cachedData !== undefined) {
                // Set content items with cached data
                setContentItems(cachedData);
            } else {
                // Get from backend service
                Canvas.BackendService.getContentItems(parentContentItem, function (contentItems) {
                    // Set content items and cache the data
                    setContentItems([parentContentItem]);
                    addContentItemsToCache(parentContentItem.id, contentItems);
                }, function (error) {
                    console.log("No content items for parent content id found!!!", error);
                });
            }
        }

        // Get content items from cache with given parent content
        function getContentItemsFromCache(parentContentItem) {
            // Check if parent content item is not root
            if (parentContentItem.id === 0) {
                var cachedData = getTimelineFromCache(_timelineID);
                if (cachedData !== undefined) {
                    return cachedData.contentItems;
                }

                // Timeline not found in cache
                return undefined;
            }

            // Check for caching
            if (_cache !== undefined) {
                // Try to get the data from the cache
                var data = _cache.getItem("C" + parentContentItem.id);

                // Check if data is found
                if (data !== null) {
                    // Clear children
                    parentContentItem.clearChildren();

                    // Parse json and create content items from cache
                    var contentItems = convertDataArrayToContentItems(JSON.parse(data), parentContentItem);

                    // Add parent content item to response 
                    var length = contentItems.length;
                    for (var i = 0; i < length; i++) {
                        parentContentItem.addChild(contentItems[i]);
                    }

                    // Return response 
                    return [parentContentItem];
                }
            }

            // No caching or data not found
            return undefined;
        }

        // Add content items to cache
        function addContentItemsToCache(parentContentItemID, contentItems) {
            // Check for caching
            if (_cache !== undefined) {
                // Get data from all content items
                var items = convertContentItemsToDataArray(contentItems);

                // Store in cache as json
                _cache.setItem("C" + parentContentItemID, JSON.stringify(items));
            }
        }

        // Convert content items to array by getting all the data objects from each content item
        function convertContentItemsToDataArray(contentItems) {
            var items = [];

            var length = contentItems.length;
            for (var i = 0; i < length; i++) {
                items.push(contentItems[i].getData());
            }

            return items;
        }

        // Convert data array to content item objects
        function convertDataArrayToContentItems(data, parentContentItem) {
            var contentItems = [];

            var length = data.length;
            for (var i = 0; i < length; i++) {
                contentItems.push(new ContentItem(data[i], parentContentItem));
            }

            return contentItems;
        }

        // Find timeline
        function findTimeline(timelineId) {
            // Get cached data
            var cachedData = getTimelineFromCache(timelineId);
            if (cachedData !== undefined) {
                // Set the timeline with the cached data
                setTimeline(cachedData);
            } else {
                // Get from backend service
                Canvas.BackendService.getTimeline(timelineId, function (timeline) {
                    // Cache the timeline
                    addTimelineToCache(timeline.id, timeline);

                    // Set the timeline
                    setTimeline(timeline);
                }, function (error) {
                    console.log("No timeline data found!!!", error);
                });
            }
        }

        // Set the new timeline
        function setBackground(backgroundUrl) {
            if (!!backgroundUrl) {
                document.getElementById("canvas").style.backgroundImage = "url('" + backgroundUrl + "')";
            } else {
                backgroundUrl = Canvas.Settings.getDefaultTimelineBackground();
                document.getElementById("canvas").style.backgroundImage = "url('" + backgroundUrl + "')";
            }
        }

        function setTimeline(timeline) {
            // Set current timeline id
            _timelineID = timeline.id;

            // Set the background if a background exists
            setBackground(timeline.backgroundUrl);

            // Set timeline range
            var parentContentItem = timeline.contentItems[0].getParentContentItem();
            var rangeItem = parentContentItem.getEndDate() - parentContentItem.getBeginDate();
            var rangeBegin = parentContentItem.getBeginDate() - (rangeItem / 20);
            var rangeEnd = parentContentItem.getEndDate() + (rangeItem / 20);
            Canvas.Timescale.setRange(rangeBegin, rangeEnd);

            // Set breadcrumb with root
            Canvas.Breadcrumbs.setContentItem(parentContentItem.getChildren()[0]);

            // Set content items
            setContentItems(timeline.contentItems);

            // Be sure that there is no full screen active
            Canvas.Timeline.stopFullScreenContentItemMode();

            // Set title and range of the window
            Canvas.WindowManager.setTitle(timeline.title);
            Canvas.WindowManager.setTimeRange(timeline.beginDate + " - " + Math.ceil(timeline.endDate));
        }

        // Set the background of the canvas/timeline
        // Add timeline to cache
        function addTimelineToCache(timelineID, timeline) {
            // Check for caching
            if (_cache !== undefined) {
                // Get data from all content items
                var items = convertContentItemsToDataArray(timeline.contentItems);

                // Store in cache as json
                _cache.setItem("T" + timelineID, JSON.stringify({
                    id: timelineID,
                    beginDate: timeline.beginDate,
                    endDate: timeline.endDate,
                    title: timeline.title,
                    contentItems: items,
                    parentContentItem: timeline.contentItems[0].getParentContentItem().getData(),
                    backgroundUrl : timeline.backgroundUrl
                }));
            }
        }

        // Get timeline from cache with given timeline id
        function getTimelineFromCache(timelineID) {
            // Check for caching
            if (_cache !== undefined) {
                // Try to get the data from the cache
                var data = _cache.getItem("T" + timelineID);

                // Check if data is found
                if (data !== null) {
                    // Parse data to json
                    var json = JSON.parse(data);

                    // Create parent content item
                    var parentContentItem = new ContentItem(json.parentContentItem, undefined);

                    // Parse json and create content items from cache
                    var contentItems = convertDataArrayToContentItems(json.contentItems, parentContentItem);

                    // Return response
                    return {
                        id: json.id,
                        beginDate: json.beginDate,
                        endDate: json.endDate,
                        title: json.title,
                        contentItems: contentItems,
                        backgroundUrl : json.backgroundUrl
                    };
                }
            }

            // No caching or data not found
            return undefined;
        }

        initialize();
    })(Canvas.ContentItemService || (Canvas.ContentItemService = {}));
    var ContentItemService = Canvas.ContentItemService;
})(Canvas || (Canvas = {}));
