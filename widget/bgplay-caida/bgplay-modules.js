/*
 * Massimo Candela for CAIDA
 */


define(
    [
            BGPLAY_MODULES_URL + "bgplay/BgpDataChecksView.js",
            BGPLAY_MODULES_URL + "bgplay/ControllerQuerySimpleView.js",
            BGPLAY_MODULES_URL + "bgplay/InfoPanelView.js",
            BGPLAY_MODULES_URL + "bgplay/GraphView.js",
            BGPLAY_MODULES_URL + "bgplay/TimelineView.js",
            BGPLAY_MODULES_URL + "bgplay/ControllerView.js",
            BGPLAY_MODULES_URL + "bgplay/LegendView.js",
            BGPLAY_MODULES_URL + "bgplay/NodePositionView.js",
            BGPLAY_MODULES_URL + "bgplay/OptionPopupView.js",
            BGPLAY_MODULES_URL + "bgplay/OptionAnimationSpeedView.js",
            BGPLAY_MODULES_URL + "bgplay/OptionRestoreGraph.js",
            BGPLAY_MODULES_URL + "bgplay/OptionGraphDeep.js",
            BGPLAY_MODULES_URL + "bgplay/OptionLinkWeight.js",
            BGPLAY_MODULES_URL + "bgplay/AboutBgplayView.js"

    ],  function(

        BgpDataChecksView,
        ControllerQuerySimpleView,
        InfoPanelView,
        GraphView,
        TimelineView,
        ControllerView,
        LegendView,
        NodePositionView,
        OptionPopupView,
        OptionAnimationSpeedView,
        OptionRestoreGraph,
        OptionGraphDeep,
        OptionLinkWeight,
        AboutBgplayView
        ){

        return [
            {"types":["bgp"], "modes":["consistent"], "view": BgpDataChecksView}, //look! types and modes are in OR
            {"types":["bgp"], "modes":["inconsistent"], "domClass": "bgplayControllerDiv", "view": ControllerQuerySimpleView},
            {"types":["all"], "modes":["consistent"], "domClass": "bgplayInfoDiv", "view": InfoPanelView},
            {"types":["all"], "modes":["consistent"], "domClass": "bgplayGraphDiv", "view": GraphView},
            {"types":["all"], "modes":["consistent"], "domClass": "bgplayTimelineDiv", "view": TimelineView},
            {"types":["bgp"], "modes":["consistent"], "domClass": "bgplayControllerDiv", "view": ControllerView},
            {"types":["bgp"], "modes":["consistent"], "domClass": "bgplayLegendDiv", "view": LegendView},
            {"types":["all"], "modes":["consistent"], "view": NodePositionView},
            {"types":["all"], "modes":["consistent"], "view": OptionPopupView},
            {"types":["all"], "modes":["consistent"], "view": OptionAnimationSpeedView},
            {"types":["all"], "modes":["consistent"], "view": OptionGraphDeep},
            {"types":["all"], "modes":["consistent"], "view": OptionLinkWeight},
            {"types":["all"], "modes":["consistent"], "view": AboutBgplayView},
            {"types":["all"], "modes":["consistent"], "view": OptionRestoreGraph}
        ]

    });