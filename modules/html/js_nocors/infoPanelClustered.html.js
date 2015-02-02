addTemplateContent('infoPanelClustered.html', '<div class="bgplayTitle">Info</div>'+
'{{#node}}'+
'{{#node.id}}<div><b>Node ID:</b> {{node.id}}</div>{{/node.id}}'+
'{{#node.attributes.owner}}<div><b>Owner:</b> {{node.attributes.owner}}</div>{{/node.attributes.owner}}'+
'{{#node.attributes.address}}<div><b>Address:</b> {{node.attributes.address}}</div>{{/node.attributes.address}}'+
    '{{#node.attributes.cluster.id}}<div>AS ID: {{node.attributes.cluster.id}}</div>{{/node.attributes.cluster.id}}'+
    ''+
'{{#node.attributes.country}}<div><b>Country:</b> {{node.attributes.country}}</div>{{/node.attributes.country}}'+
'{{/node}}'+
''+
'{{#cluster}}'+
'{{^node}}'+
'{{^cluster.id}}<div><b>Cluster ID:</b> 0</div>{{/cluster.id}}'+
    '{{#cluster.attributes.asNumber}}<div><b>AS:</b> {{cluster.attributes.asNumber}}</div>{{/cluster.attributes.asNumber}}'+
    '{{#cluster.attributes.holder}}<div><b>Holder:</b> {{cluster.attributes.holder}}</div>{{/cluster.attributes.holder}}'+
'{{#cluster.attributes.containsTargets}}<div><b>Contains resources:</b> yes</div>{{/cluster.attributes.containsTargets}}'+
'{{#cluster.attributes.containsSources}}<div><b>Contains probes:</b> yes</div>{{/cluster.attributes.containsSources}}'+
    '{{#cluster.id}}<div>Cluster ID: {{cluster.id}}</div>{{/cluster.id}}'+
    '{{/node}}'+
'{{/cluster}}'+
''+
'{{#path}}'+
'{{^node}}'+
'{{#path.attributes.source}}<div><b>Source:</b> {{path.attributes.source.attributes.idProbe}}</div>{{/path.attributes.source}}'+
'{{#path.attributes.target}}<div><b>Target:</b> {{path.attributes.target.attributes.msmId}}</div>{{/path.attributes.target}}'+
'{{#pathString}}<div><b>Current Path:</b> {{pathString}}</div>{{/pathString}}'+
'{{#pathStatistics}}<div><b>Statistics:</b> {{pathStatistics}}</div>{{/pathStatistics}}'+
'{{/node}}'+
'{{/path}}'+
''+
''+
'{{^cluster}}'+
'{{^node}}'+
'{{^path}}'+
''+
''+
'{{^lastEvent.isInitialInstant}}'+
'<div>'+
'    {{#lastEvent.attributes.subType}}<b>Type:</b> {{lastEvent.attributes.type}} &gt; {{lastEvent.attributes.subType}}{{/lastEvent.attributes.subType}}'+
'    {{#lastEvent.attributes.target}} <b>Involving:</b> {{lastEvent.attributes.target}}{{/lastEvent.attributes.target}}'+
'</div>'+
'{{#lastEvent.attributes.shortdescription}}<div><b>Short description:</b> {{lastEvent.attributes.shortdescription}}</div>{{/lastEvent.attributes.shortdescription}}'+
'<!--{{#lastEvent.attributes.longdescription}}<div><b>Long description:</b> {{lastEvent.attributes.longdescription}}</div>{{/lastEvent.attributes.longdescription}}-->'+
'<!--{{#lastEvent.attributes.path}}<div><b>Path:</b> {{lastEvent.attributes.path}}</div>{{/lastEvent.attributes.path}}-->'+
''+
'{{#lastEvent.attributes.path}}'+
'<div>'+
'    <b>Path:</b>'+
'    {{#lastEvent.attributes.path.attributes.nodes}}<a href="javascript:void(0);" class="bgplayAsLink">{{id}}</a>, {{/lastEvent.attributes.path.attributes.nodes}}'+
'</div>'+
'{{/lastEvent.attributes.path}}'+
''+
'{{#lastEvent.attributes.community}}<div><b>Community:</b> {{lastEvent.attributes.community}}</div>{{/lastEvent.attributes.community}}'+
'<div>'+
'    {{#lastEvent.attributes.instant}}<b>Date and time:</b> {{lastEvent.attributes.instant.getDate}}{{/lastEvent.attributes.instant}}'+
'    {{#lastEvent.attributes.source}} <b>Collected by:</b> {{lastEvent.attributes.source}}{{/lastEvent.attributes.source}}'+
'</div>'+
'{{/lastEvent.isInitialInstant}}'+
''+
''+
'{{#lastEvent.isInitialInstant}}'+
'{{#lastEvent.attributes.subType}}<div><b>Type:</b> Initial state</div>{{/lastEvent.attributes.subType}}'+
'<div><b>Number of ASes:</b> {{numberOfNodes}}</div>'+
'<div><b>Selected Probes:</b> {{environment.params.selectedProbes}}</div>'+
'<div><b>Total number of events:</b> {{numberOfEvents}}</div>'+
''+
'{{#lastEvent.attributes.instant}}<div><b>Date and time:</b> {{lastEvent.attributes.instant.getDate}}</div>{{/lastEvent.attributes.instant}}'+
'{{/lastEvent.isInitialInstant}}'+
'{{/path}}'+
'{{/node}}'+
'{{/cluster}}'+
'');