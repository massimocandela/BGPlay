addTemplateContent('graph.html', '{{#isMobile}}'+
'<img class="touchGraphEvents" src = "{{imageRoot}}touch_icon_disabled.png" />'+
'{{/isMobile}}' +
'<input type="button" class="zoom-controller zoom-in" value="+"/>' +
'<input type="button" class="zoom-controller zoom-out" value="-"/>'+
'<div class="bgplayNodeContainer unselectable" unselectable="on">'+
'</div>');