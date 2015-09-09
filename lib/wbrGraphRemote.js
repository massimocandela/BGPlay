///*
// * BGPlay.js
// * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
// * http://www.bgplayjs.com
// *
// * See the file LICENSE.txt for copying permission.
// */
//
//
//var BgplayGraph = function (options) {
//    if (!net.webrobotics.TreeMap) {
//        console.log('Webrobotics\'s TreeMap required');
//        return null;
//    }
//    this.nodeId = 0;
//    this.arcId = 0;
//
//    this.environment = options.environment;
//    this.eventAggregator = options.eventAggregator;
//    this.graphView = options.graphView;
//    this.iterations = setValuePriority("iterations", 500);
//    this.elasticCoefficient = setValuePriority("elasticCoefficient", 1);
//    this.parentDimensionX = setValuePriority("parentDimensionX", 100);
//    this.parentDimensionY = setValuePriority("parentDimensionY", 100);
//    this.nodeDiameter = (options) ? options.nodeDiameter : 100 || 100;
//    this.layoutId = null;
//    this.firstDraw = true;
//
//    function setValuePriority(optionsKey, val2) {
//        if (options != null) {
//            return (options[optionsKey] != null) ? options[optionsKey] : val2;
//        }
//        return val2;
//    }
//
//    this.utils = new net.webrobotics.GraphUtils();
//
//    this.vertices = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});
//
//    this.clusters = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});
//
//    this.pipesC = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});
//    this.edgesC = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});
//    this.inbeamsC = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});
//    this.outbeamsC = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:false, suppressDuplicateKeyAlerts:true});
//
//
//    var pathComparator = function (k1, k2) {
//        if (k1.source.id < k2.source.id || (k1.source.id == k2.source.id && k1.target.id < k2.target.id)) {
//            return -1;
//        }
//        if (k1.source.id > k2.source.id || (k1.source.id == k2.source.id && k1.target.id > k2.target.id)) {
//            return 1;
//        }
//        return 0; //equals
//    };
//    this.paths = new net.webrobotics.TreeMap(pathComparator, {allowDuplicateKeys:true, suppressDuplicateKeyAlerts:true});
//
//    var edgeComparator = function (k1, k2) {
//        if (k1.vertexStart.graphId < k2.vertexStart.graphId || (k1.vertexStart.graphId == k2.vertexStart.graphId && k1.vertexStop.graphId < k2.vertexStop.graphId)) {
//            return -1;
//        }
//        if (k1.vertexStart.graphId > k2.vertexStart.graphId || (k1.vertexStart.graphId == k2.vertexStart.graphId && k1.vertexStop.graphId > k2.vertexStop.graphId)) {
//            return 1;
//        }
//        return 0; //equals
//    };
//    this.edges = new net.webrobotics.TreeMap(edgeComparator, {allowDuplicateKeys:true, suppressDuplicateKeyAlerts:true});
//};
//
////The node object MUST have these properties:id, x, y
//BgplayGraph.prototype.addNode = function (node) {
//    node.graphId = node.model.id;
//    node.vectors = [];
//    node.edges = 0;
//    this.vertices.put(node.graphId, node);
//    return node;
//};
//
//BgplayGraph.prototype.addCluster = function (cluster) {
//    cluster.graphId = cluster.model.id;
//    this.clusters.put(cluster.graphId, cluster);
//    return cluster;
//};
//
//BgplayGraph.prototype.addPath = function (path) {
//    var next, current, nodes, source, target, orderedNodes, key, edge, present, arc, initial;
//    source = path.get("source");
//    target = path.get("target");
//    nodes = path.get("nodes");
//    key = source.id+"-"+target.id;
//
//    initial = (this.paths.get({source:source, target:target}) != null);
//    for (var n=0, length=nodes.length; n < length-1; n++) {
//        next = nodes[n+1];
//        current = nodes[n];
//        orderedNodes = this.utils.absOrientation(current, next);
//
//        edge = this.edges.get({vertexStart:orderedNodes[0].view, vertexStop:orderedNodes[1].view});
//
//        present = false;
//        if (edge != null){
//            for (var y=0, length2=edge.length; y<length2; y++){
//                arc = edge[y];
//                if (arc.key == key){ //An arc for each key
//                    present = true;
//                }
//            }
//        }
//        if (!present){
//            next.view.addNeighbor(current);
//            current.view.addNeighbor(next);
//
//            this.edges.put(
//                {vertexStart:orderedNodes[0].view, vertexStop:orderedNodes[1].view, toString:function () {
//                    return this.vertexStart.graphId + "-" + this.vertexStop.graphId;
//                }},
//                {id:this.arcId, key:key, drawn:false, initial:initial}
//            );
//            this.arcId++;
//        }
//    }
//    this.paths.put({source:source,target:target}, nodes);
//    return path;
//};
//
//BgplayGraph.prototype.getMinY = function(refresh) {
//    var min;
//    if (refresh == true || this.minY == null){
//        this.vertices.forEach(function(node){
//            if (node.y < min || min == null){
//                min = node.y;
//            }
//        });
//        this.minY = min;
//    }
//    return this.minY;
//}
//
//BgplayGraph.prototype.getMaxY = function (refresh) {
//    var max;
//    if (refresh == true || this.maxY == null){
//        this.vertices.forEach(function(node){
//            if (node.y > max || max == null){
//                max = node.y;
//            }
//        });
//        this.maxY = max;
//    }
//    return this.maxY;
//}
//
//BgplayGraph.prototype.getMinX = function (refresh) {
//    var min;
//    if (refresh == true || this.minX == null){
//        this.vertices.forEach(function(node){
//            if (node.x < min || min == null){
//                min = node.x;
//            }
//        });
//        this.minX = min;
//    }
//    return this.minX;
//}
//
//BgplayGraph.prototype.getMaxX = function (refresh) {
//    var max;
//    if (refresh == true || this.maxX == null){
//        this.vertices.forEach(function(node){
//            if (node.x > max || max == null){
//                max = node.x;
//            }
//        });
//        this.maxX = max;
//    }
//    return this.maxX;
//}
//
//BgplayGraph.prototype.getScaleFactor = function(width, height){
//    var maxX, minX, maxY, minY, hOuter, wOuter, scaleFactor, minimumScaleFactor;
//    minimumScaleFactor = 0.5;
//    maxX = this.getMaxX();
//    minX = this.getMinX();
//    maxY = this.getMaxY();
//    minY = this.getMinY();
//    wOuter = (maxX-minX);
//    hOuter = (maxY-minY);
//
//    scaleFactor = (wOuter-width > hOuter-height)? wOuter/width : hOuter/height;
//
//    return Math.max(scaleFactor, minimumScaleFactor);
//
//}
//
//BgplayGraph.prototype.computePosition = function () {
//    var url, $this, firstDraw;
//
//    url = this.environment.jsonWrap.getRemoteLayoutUrl(this.layoutId, this.environment.params);
//    $this = this;
//
//    log(url);
//
//    $.getJSON(
//        url+"&callback=?",
//        {},
//        function(json){
//            var n, length, clusters, cluster, clusterTmp, params, layout, layersRadii,
//                nodes, nodeTmp, node, nodesPosition, centerCluster, layerTmp;
//
//            $this.layoutId = $this.layoutId || json.layoutId;
//
//            nodesPosition = {};
//            params = {};
//
//            if (json.graphics){
//                // Retrive all the graphic parameters
//                params.clusterWidth = json.graphics["cluster-width"];
//                params.clusterHeight = json.graphics["cluster-height"];
//
//                params.nodeWidth = json.graphics["vertex-width"]*0.8;
//                params.nodeHeight = json.graphics["vertex-height"]*0.8;
//
//            }
//
//            layout = (json.layout) ? json.layout : json.steps[0];
//
//            params.showOrbits = (getUrlParam("showOrbits") == "false" || layout.layer_radii == null) ? false : true;
//
//            params.layerRadii = [];
//            layersRadii = layout["layer_radii"];
//            if (layersRadii != null){
//                length = layersRadii.length;
//                for (n=0; n<length; n++){
//                    layerTmp = layersRadii[n];
//                    params.layerRadii.push(layerTmp.radius);
//                }
//            }
//            params.center = layout.center;
//
//            if (json.graph){
//                // Retrive a.ll the graph components
//                if (json.graph.pipes) $this.getPipes(json.graph.pipes);
//                if (json.graph.edges)$this.getEdges(json.graph.edges);
//                if (json.graph.inbeams)$this.getInBeams(json.graph.inbeams);
//                if (json.graph.outbeams)$this.getOutBeams(json.graph.outbeams);
//            }
//
//            if (layout){
//                if (layout.pipes) $this.setPipesBends(layout.pipes);
//                if (layout.edges) $this.setEdgesBends(layout.edges);
//                if (layout.inbeams) $this.setInbeamsBends(layout.inbeams);
//                if (layout.outbeams) $this.setOutbeamsBends(layout.outbeams);
//
//
//                clusters = layout.clusters;
//                nodes = layout.vertices || 0;
//
//                // Get position of the nodes
//                for (n=0, length=nodes.length; n<length; n++){
//                    nodeTmp = nodes[n];
//                    nodesPosition[nodeTmp.vertex_id] = nodeTmp;
//                }
//
//                // Get position and perimeter of the cluster
//                for (n=0, length=clusters.length; n<length; n++){
//                    clusterTmp = clusters[n];
//                    cluster = $this.clusters.get(clusterTmp.cluster_id);
//
//                    if (clusterTmp.perimeter){
//                        cluster.perimeter = clusterTmp.perimeter;
//                        cluster.expanded = clusterTmp.expanded || false;
//                    }
//                    if (params.clusterWidth) cluster.width = params.clusterWidth;
//                    if (params.clusterHeight) cluster.height = params.clusterHeight;
//
//                    if (clusterTmp.x != null){
//                        cluster.oldX = cluster.x;
//                        cluster.oldY = cluster.y;
//                        cluster.x = clusterTmp.x;
//                        cluster.y = clusterTmp.y;
//                    }
//                }
//
//                // set a default position for each node
//                $this.vertices.forEach(function(vertex){
//                    if (params.nodeWidth) vertex.nodeWidth = params.nodeWidth;
//                    if (params.nodeHeight) vertex.nodeHeight = params.nodeHeight;
//
//                    if (nodesPosition[vertex.model.id] != null){
//                        vertex.x = nodesPosition[vertex.model.id].x;
//                        vertex.y = nodesPosition[vertex.model.id].y;
//                        vertex.visible = true;
//                    }else{
//                        centerCluster = vertex.cluster.getCenter();
//
//                        vertex.x = centerCluster.x;
//                        vertex.y = centerCluster.y;
//                    }
//                });
//                nodesPosition = [];
//            }
//
//            $this.params = params;
//
//            $this.eventAggregator.trigger("updateDraw"); //draw
//            if ($this.firstDraw == true){
//                $this.eventAggregator.trigger("checkPathPosition");
//                $this.firstDraw = false;
//                $this.eventAggregator.trigger("scaleGraph");
//            }else{
//                $this.eventAggregator.trigger("updatePathDraw");
//
//            }
//        }
//    );
//}
//
//
//BgplayGraph.prototype.getPipes = function(pipes){
//    var n, length, pipeTmp, connection, start, stop;
//
//    length = pipes.length;
//
//    for (n=0; n<length; n++){
//        pipeTmp = pipes[n];
//        start = this.environment.bgplay.getCluster(pipeTmp.from_cluster);
//        stop = this.environment.bgplay.getCluster(pipeTmp.to_cluster);
//
//        connection = {source: start, target: stop, id: pipeTmp.id};
//
//        this.graphView.pipes.put({source: start, target: stop}, connection);
//        this.pipesC.put(pipeTmp.id, connection);
//    }
//}
//
//BgplayGraph.prototype.getEdges = function(edges){
//    var n, length, edgeTmp, connection, start, stop;
//
//    length = edges.length;
//
//    for (n=0; n<length; n++){
//        edgeTmp = edges[n];
//        start = this.environment.bgplay.getNode(edgeTmp.from_vertex);
//        stop = this.environment.bgplay.getNode(edgeTmp.to_vertex);
//
//        connection = {source: start, target: stop, id: edgeTmp.id};
//
//        this.graphView.edgesClustered.put({source: start, target: stop}, connection);
//        this.edgesC.put(edgeTmp.id, connection);
//    }
//}
//
//BgplayGraph.prototype.getInBeams = function(inbeams){
//    var n, length, inbeamTmp, connection, start, stop;
//
//    length = inbeams.length;
//
//    for (n=0; n<length; n++){
//        inbeamTmp = inbeams[n];
//        start = this.environment.bgplay.getNode(inbeamTmp.from_vertex);
//        stop = this.environment.bgplay.getCluster(inbeamTmp.to_cluster);
//
//        connection = {source: start, target: stop, id: inbeamTmp.id};
//
//        this.graphView.inbeams.put({source: start, target: stop}, connection);
//        this.inbeamsC.put(inbeamTmp.id, connection);
//    }
//}
//
//BgplayGraph.prototype.getOutBeams = function(outbeams){
//    var n, length, outbeamsTmp, connection, start, stop;
//
//    length = outbeams.length;
//
//    for (n=0; n<length; n++){
//        outbeamsTmp = outbeams[n];
//        start = this.environment.bgplay.getCluster(outbeamsTmp.from_cluster);
//        stop = this.environment.bgplay.getNode(outbeamsTmp.to_vertex);
//
//        connection = {source: start, target: stop, id: outbeamsTmp.id};
//
//        this.graphView.outbeams.put({source: start, target: stop}, connection);
//        this.outbeamsC.put(outbeamsTmp.id, connection);
//    }
//}
//
//BgplayGraph.prototype.setPipesBends = function(pipes){
//    var length, pipeTmp, pipe, n;
//    length = pipes.length;
//
//    for (n=0; n<length; n++){
//        pipeTmp = pipes[n];
//        pipe = this.pipesC.get(pipeTmp.pipe_id);
//        pipe.bends = pipeTmp.bends || [];
//    }
//}
//
//BgplayGraph.prototype.setEdgesBends = function(edges){
//    var length, edgeTmp, edge, n;
//    length = edges.length;
//
//    for (n=0; n<length; n++){
//        edgeTmp = edges[n];
//
//        edge = this.edgesC.get(edgeTmp.edge_id);
//        if (edge == null) alert(edgeTmp.edge_id);
//        edge.bends = edgeTmp.bends || [];
//    }
//}
//
//BgplayGraph.prototype.setInbeamsBends = function(inbeams){
//    var length, inbeamTmp, inbeam, n;
//    length = inbeams.length;
//
//    for (n=0; n<length; n++){
//        inbeamTmp = inbeams[n];
//        inbeam = this.inbeamsC.get(inbeamTmp.inbeam_id);
//        inbeam.bends = inbeamTmp.bends || [];
//    }
//}
//
//BgplayGraph.prototype.setOutbeamsBends = function(outbeams){
//    var length, outbeamTmp, outbeam, n;
//    length = outbeams.length;
//
//    for (n=0; n<length; n++){
//        outbeamTmp = outbeams[n];
//        outbeam = this.outbeamsC.get(outbeamTmp.outbeam_id);
//        outbeam.bends = outbeamTmp.bends || [];
//    }
//}
//
//
//BgplayGraph.prototype.getCenter = function(){
//    var maxX, minX, maxY, minY, center;
//    maxX = this.getMaxX();
//    minX = this.getMinX();
//    maxY = this.getMaxY();
//    minY = this.getMinY();
//    center = {};
//    center.x = (((maxX - minX)/2) + minX);
//    center.y = (((maxY - minY)/2) + minY);
//
//    return center;
//}
//
//
