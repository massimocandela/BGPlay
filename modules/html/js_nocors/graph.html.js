addTemplateContent('graph.html', '{{#isMobile}}'+
'<img class="touchGraphEvents" src = "{{imageRoot}}touch_icon_disabled.png" />'+
'{{/isMobile}}' +
'{{^isMobile}}' +
'<input type="button" class="zoom-controller zoom-in" value="+"/>' +
'<input type="button" class="zoom-controller zoom-out" value="-"/>' +
'{{/isMobile}}'+
'<div class="bgplayNodeContainer unselectable" unselectable="on">'+
'<div class="searchNode">Search AS:<input type="text" value="" placeholder="ASN"/></div>'+
'</div>');