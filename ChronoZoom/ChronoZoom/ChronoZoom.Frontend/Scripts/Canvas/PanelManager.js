﻿var Canvas;
(function (Canvas) {
    (function (PanelManager) {
        // Public methods
        PanelManager.showTimelinePanel = showTimelinePanel;
        PanelManager.handleImportPanel = handleImportPanel;
        PanelManager.handleImportPanelInput = handleImportPanelInput;
        PanelManager.handleAddTimelineClick = handleAddTimelineClick;
        PanelManager.addTimelines = addTimelines;

        var showTimeLineImport;

        function showTimelinePanel(showPanel) {
            var inputPanel = document.getElementById('timelinePanel');
            inputPanel.className = showPanel ? 'timelinePanelShow' : 'timelinePanelHidden';
        }

        function handleImportPanel() {
            var importPanel = document.getElementById('importPanel');
            importPanel.className = importPanel.className === 'importPanelHidden' ? 'importPanelShow' : 'importPanelHidden';
        }

        function handleImportPanelInput() {
            var title = document.getElementById("titleInput").value;
            var startDate = document.getElementById("startDateInput").value;
            var endDate = document.getElementById("endDateInput").value;
            var description = document.getElementById("descriptionInput").value;

            Canvas.BackendService.createPersonalTimeLine(title, startDate, endDate);


            // write output to panel
            var output = document.getElementById("importOutput");
            if (output.textContent !== undefined) {
                output.textContent = "Input received: " + title + " " + startDate + " " + endDate + " " + description;
            }
        }

        function addTimelines() {
            Canvas.BackendService.getAllTimelines(function (timelines) {
                for (var i = 0; i < timelines.length; i++) {
                    console.log(timelines[i].title);
                }

            }, function (error) {
                console.log("Error getting al timelines");
            });
        }

        function handleAddTimelineClick(showImportPanel) {
            var importPanel = document.getElementById('importPanel');

            if (importPanel.className = 'importPanelHidden') {
                importPanel.className = 'importPanelShow';
            }
            else {
                console.log('show');
                importPanel.className = 'importPanelShow';
            }

            //importPanel.className = showImportPanel ? 'importPanelShow' : 'importPanelHidden';
        }

    })(Canvas.PanelManager || (Canvas.PanelManager = {}));
    var PanelManager = Canvas.PanelManager;
})(Canvas || (Canvas = {}));