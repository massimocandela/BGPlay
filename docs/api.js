YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "BgpDataChecksView",
        "Bgplay",
        "ControllerView",
        "Event",
        "FullScreenView",
        "GraphView",
        "InfoPanelView",
        "Instant",
        "JsonWrapRipestat",
        "LivePermalinkView",
        "MainView",
        "Node",
        "NodePositionView",
        "NodeView",
        "Path",
        "PathView",
        "ScreenShotView",
        "Source",
        "Target",
        "TimelineView"
    ],
    "modules": [
        "model",
        "modules"
    ],
    "allModules": [
        {
            "displayName": "model",
            "name": "model",
            "description": "This is the Facade of the model layer.\nIt manages all the collections of objects of the model layer and all the parameters needed to describe the domain."
        },
        {
            "displayName": "modules",
            "name": "modules",
            "description": "This is a module specific for BGP.\nThe objective of this module is to provide a set of auto-start function for checking BGP data."
        }
    ]
} };
});