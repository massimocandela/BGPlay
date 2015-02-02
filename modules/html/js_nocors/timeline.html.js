addTemplateContent('timeline.html', '<div>'+
'    <div class="bgplayTimelineControlDiv" style="width:{{controlChartWidth}}px;">'+
'        <div draggable="true" class="draggable bgplayTimelineControlCanvasSlider bgplayTimelineControlCanvasSliderLeft" />'+
'        <div draggable="true" class="draggable bgplayTimelineControlCanvasSlider bgplayTimelineControlCanvasSliderRight" />'+
'        <div style="">'+
'            <div class="bgplayTimelineControlCanvasText"></div>'+
'            <div class="bgplayTimelineControlCanvasDate"></div>'+
'        </div>'+
'        <canvas class="bgplayTimelineControlCanvas" width="{{controlChartWidth}}" height="{{controlChartHeight}}">Your browser doesn\'t support HTML5 Canvas.</canvas>'+
'    </div>'+
''+
'    <div class="bgplayTimelineSelectionDiv">'+
'        <img class="bgplayTimelineSelectionSliderLeft" alt="Next" title="Next" src="{{imageRoot}}miniarrow_left.gif"/>'+
'        <img class="bgplayTimelineSelectionSliderRight" alt="Prev" title="Prev" src="{{imageRoot}}miniarrow_right.gif"/>'+
''+
'        <img class="bgplayTimelineSelectionWaitIco" alt="wait" title="wait" src="{{imageRoot}}drawing.png"/>'+
'        <img class="bgplayTimelineSelectionWarpIco" alt="warp" title="warp" src="{{imageRoot}}warp.gif"/>'+
'        <canvas class="bgplayTimelineSelectionCanvas" width="{{selectionChartWidth}}" height="{{selectionChartHeight}}">Your browser doesn\'t support HTML5 Canvas.</canvas>'+
'    </div>'+
'    <img class="bgplayTimelineSelectionNext" alt="Next" title="Next" src="{{imageRoot}}next.png"/>'+
'    <img class="bgplayTimelineSelectionPrev" alt="Prev" title="Prev" src="{{imageRoot}}prev.png"/>'+
'</div>');