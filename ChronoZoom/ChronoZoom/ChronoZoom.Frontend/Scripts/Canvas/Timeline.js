﻿var Canvas;
(function (Canvas) {
    (function (Timeline) {
        // Public methods
        Timeline.draw = draw;
        Timeline.update = update;
        Timeline.handleClickOnTimeline = handleClickOnTimeline;

        // Private fields
        var _contentItems = [];
        var _isLoading = true;

        // Constructor
        function initialize() {
            Canvas.ContentItemService.addListener(onContentItemsChanged);
        }

        // Handle on content item changed event
        function onContentItemsChanged() {
            // Get content items
            _contentItems = Canvas.ContentItemService.getContentItems();

            // Update flags
            _isLoading = false;
        }

        // Update the timeline
        function update() {
            // Update all content items
            var length = _contentItems.length;
            for (var i = 0; i < length; i++) {
                _contentItems[i].update(_contentItems);
            }
        }

        // Draw the timeline
        function draw() {
            if (_isLoading) {
                drawLoader();
            } else {
                drawContentItems();
                drawToolTip();
            }
        }

        // Draw loader
        function drawLoader() {
            var context = Canvas.getContext();
            context.font = Canvas.Settings.getTimescaleTickLabelFont();
            context.fillStyle = Canvas.Settings.getTimescaleTickLabelColor();
            context.fillText("LOADING...", 100, 100);
        }

        // Draw (visible) content items
        function drawContentItems() {
            // Get current range
            var range = Canvas.Timescale.getRange();

            // Draw all content items that has childeren first
            drawContentItemsLoop(range, true);
            drawContentItemsLoop(range, false);
        }

        // Draw content item loop
        function drawContentItemsLoop(range, hasChildren) {
            // Check all content items
            var length = _contentItems.length;
            for (var i = 0; i < length; i++) {
                if (_contentItems[i].hasChildren() === hasChildren) {
                    // Draw content item
                    drawContentItem(range, _contentItems[i]);
                }
            }
        }

        // Draw given content item on canvas if in (current) range
        function drawContentItem(range, contentItem) {
            // Check if content item visible in current range
            if (contentItem.getBeginDate() >= range.begin && contentItem.getEndDate() <= range.end) {
                contentItem.draw();
            }
        }

        // Draw tooltip
        function drawToolTip() {
            if (getContentItemOnMousePosition() !== undefined) {
                Canvas.Tooltip.update(getContentItemOnMousePosition());
                Canvas.Tooltip.draw();
            }
        }

        function handleClickOnTimeline() {
            // Mark loading flag
            _isLoading = true;

            // Find clicked item
            var clickedContentItem = getContentItemOnMousePosition();

            // If no item found zoom out
            if (clickedContentItem === undefined) {
                clickedContentItem = Canvas.Breadcrumbs.decreaseDepthAndGetTheNewContentItem();
            }

            // Make sure root is not reached
            if (clickedContentItem !== undefined) {
                // Update timescale and content item service
                Canvas.Timescale.setRange(clickedContentItem.getBeginDate(), clickedContentItem.getEndDate());
                Canvas.ContentItemService.findContentItemsByParentContent(clickedContentItem);
            }
        }

        // Get content item on mouse position
        function getContentItemOnMousePosition() {
            var result

            // Search through all content items
            var length = _contentItems.length;
            for (var i = 0; i < length; i++) {
                // Check if content item collides
                if ((result = checkCollision(_contentItems[i])) !== undefined) {
//console.log(result);
                    return result;
                }
            }

            // Nothing collides
         //   console.log(result);
            return result;
        }

        function checkCollision(contentItem) {
            var position = Canvas.Mousepointer.getPosition();

            if (contentItem.collides(position.x, position.y)) {
                var children = contentItem.getChildren();
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    if (checkCollision(children[i]) !== undefined) {
                        return children[i];
                    }
                }
                return contentItem;
            }
            return undefined;
        }

        initialize();
    })(Canvas.Timeline || (Canvas.Timeline = {}));
    var Timeline = Canvas.Timeline;
})(Canvas || (Canvas = {}));