/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * This class is a wrapper of the inputs.
 * @class JsonWrap
 * @module model
 */
function JsonWrap(environment){
    return {

        getType: function(){
            return "bgp";
        },

        confirm: function(data){

            return (data.events.length + data.initial_state.length > environment.config.safetyMaximumEvents || data.nodes.length > environment.config.safetyMaximumNodes);
        },

        _getConversionList: function(){

            return conversionList = {
                starttimestamp: "starttime",
                endtimestamp: "endtime",
                targets: "resource",
                selectedRrcs: "rrcs"
            };
        },

        _fromExternalToInternal: function(external, internal){
            var out, conversionList, keyUsed;

            out = internal || {};
            keyUsed = {};
            conversionList = this._getConversionList();

            for (var key in conversionList){
                out[key] = external[conversionList[key]];
                keyUsed[conversionList[key]] = true;
            }

            for (var key in external){
                if (!keyUsed[key]){
                    out[key] = external[key];
                }
            }

            return out;
        },

        _fromInternalToExternal: function(internal, external){
            var out, conversionList;

            out = external || {};


            conversionList = this._getConversionList();

            for (var key in conversionList){
                out[conversionList[key]] = internal[key];
            }

            for (var key in internal){
                if (!out[conversionList[key]]){
                    out[key] = internal[key];
                }
            }

            return out;
        },

        /**
         * This method converts input parameters.
         * @param {Map} A Map of parameters valid outside the environment
         * @return {Map} A Map of parameters valid inside the environment
         */
        getParams:function(data){
            var out, params, internalParams, selectRRCset, urlParams, embeddingCodeParams;

            out = {};

            embeddingCodeParams = environment.thisWidget.get_params();
            urlParams = {
                resource: getUrlParam("resource"),
                starttime: getUrlParam("starttime"),
                endtime: getUrlParam("endtime"),
                ignoreReannouncements: getUrlParam("ignoreReannouncements"),
                rrcs: getUrlParam("rrcs"),
                instant: getUrlParam("instant")
            };

            Object.keys(urlParams).forEach(function(key) {(urlParams[key] == null) && delete urlParams[key]});
            params = Object.assign({}, embeddingCodeParams, urlParams);

            console.log(params);
            internalParams = environment.params || {};

            selectRRCset = function(resources, currentValue){
                var value, thereIsAS;

                if (currentValue && currentValue.length > 1){
                    value = currentValue;
                } else {
                    if (typeof resources == "string"){
                        thereIsAS = !isNaN(resources.replace(/AS/g, ""));
                    } else {
                        for (var n=0,length=resources.length; n<length;n++){
                            thereIsAS = !isNaN(resources[n].replace(/AS/g, ""));
                            if (thereIsAS){
                                break;
                            }
                        }
                    }

                    value = (thereIsAS) ? environment.config.selectedRrcsAS : environment.config.selectedRrcsPrefix;
                }

                return (typeof value == "string") ? value : arrayToString(value);
            };

            if (!data){
                out = this._fromExternalToInternal(params, internalParams);
                out.selectedRrcs = selectRRCset(out.targets, params.rrcs);
            }else{

                if (params.unix_timestamps == "TRUE" || params.unix_timestamps == "true"){  //toUpperCase fails when unix_timestamps is null

                    out = {
                        starttimestamp: params.starttime || data.query_starttime,
                        endtimestamp: params.endtime || data.query_endtime,
                        showResourceController: params.showResourceController,
                        targets: ((typeof data.resource === 'string') ? data.resource : arrayToString(data.resource)),
                        selectedRrcs: ((params.rrcs != null) ? params.rrcs : selectRRCset(data.resource, params.rrcs)),
                        ignoreReannouncements: (params.hasOwnProperty("ignoreReannouncements")) ? (params.ignoreReannouncements == "true") : environment.config.ignoreReannouncementsByDefault,
                        instant: params.instant,
                        preventNewQueries: params.preventNewQueries,
                        nodesPosition: params.nodesPosition,
                        type: "bgp"
                    };

                }else{
                    alert('Unix timestamps needed!');
                }
            }

            return out;
        },

        /**
         * This method converts input parameters.
         * @param {Map} A Map of parameters valid inside the environment
         * @return {Map} A Map of parameters valid outside the environment
         */
        setParams:function(params){
            var out = environment.thisWidget.get_params();

            out.unix_timestamps="TRUE";

            if (params.starttimestamp != null) out.starttime = "" + params.starttimestamp;
            if (params.endtimestamp != null) out.endtime = "" + params.endtimestamp;
            if (params.targets != null) out.resource = "" + params.targets;
            if (params.showResourceController!=null) out.showResourceController = "" + params.showResourceController;
            if (params.selectedRrcs != null) out.rrcs = "" + params.selectedRrcs;
            if (params.ignoreReannouncements != null) out.ignoreReannouncements = "" + (params.ignoreReannouncements == true);
            out.instant = "" + params.instant;
            if (params.preventNewQueries != null) out.preventNewQueries = "" + params.preventNewQueries;
            if (params.nodesPosition != null) out.nodesPosition = "" + params.nodesPosition;
            out.type="bgp";

            environment.thisWidget.set_params(out);
            return out;
        },

        /**
         * This method returns the URL where the json file related to the provided parameters is placed.
         * @param {String} A string where the data-source is placed
         * @param {Map} A Map of parameters valid inside the environment
         * @return {String} An URL
         */
        getJsonUrl:function(params){

            var datasource = "https://stat.ripe.net/data/bgplay/data.json";
            return datasource + "?" +
                "unix_timestamps=TRUE" +
                "&type=bgp" +
                "&resource=" + params.targets +
                ((params.selectedRrcs != null)? "&rrcs=" + params.selectedRrcs : "") +
                ((params.endtimestamp != null)? "&endtime=" + params.endtimestamp : "") +
                ((params.starttimestamp != null)? "&starttime=" + params.starttimestamp : "");

        },

        /**
         * This method populates Bgplay instantiating all the object of the model layer.
         * @param {Object} A json data object
         */
        readJson:function(wrap){
            if (wrap.nodes.length == 0){
                console.log("no nodes");
                if (environment.thisWidget){
                    environment.message = {text: "No information available for these query parameters.", type:"info"};
                    return false;
                }else{
                    alert('No information available');
                    document.location=environment.config.homeUrl;
                }
            }

            printLoadingInformation(environment,"Reconstructing the history.");
            environment.bgplay = new Bgplay({
                cur_instant:new Instant({
                    id:0,
                    timestamp: wrap.query_starttime
                }),
                starttimestamp: wrap.query_starttime,
                endtimestamp: wrap.query_endtime,
                type:"bgp"
            });
            window.bgplay = environment.bgplay;
            var bgplay = environment.bgplay;

            function createNodes(wrap){
                var node, asnumber, newnode, length, nodes, n;
                nodes = wrap.nodes;
                length = nodes.length;

                for (n=0; n<length; n++){
                    node = nodes[n];
                    asnumber = node.as_number;
                    newnode = new Node({id:asnumber, asnumber:asnumber, as:asnumber, owner:node.owner, nodeUrl:"https://stat.ripe.net/AS"+asnumber, environment:environment});
                    bgplay.addNode(newnode);
                }
            }

            function createSources(wrap){
                var source, sourceNode, newsource, length, sources, n;
                sources = wrap.sources;
                length = sources.length;
                for (n=0; n<length; n++){
                    source = sources[n];
                    sourceNode = bgplay.getNode(source.as_number);
                    newsource = new Source({id:source.id, group:sourceNode, environment:environment});
                    bgplay.addSource(newsource);
                    if (sourceNode!=null)
                        sourceNode.addSource(newsource);
                }
            }

            function createTargets(wrap){
                var target, targets, length, n, newtarget;
                targets = wrap.targets;
                length = targets.length;
                for (n=0; n<length; n++){
                    target = targets[n];
                    newtarget = new Target({id:target.prefix, environment:environment});
                    bgplay.addTarget(newtarget);
                }
            }

            function createInitialState(wrap){
                var path, event, initialstate, source, tmpPath, target, tmpNode, states, length, uniquePath, n, length2, i;

                uniquePath = [];
                states = wrap.initial_state;
                length = states.length;
                for (n=0; n<length; n++){
                    initialstate = states[n];

                    target = bgplay.getTarget(initialstate.target_prefix);
                    source = bgplay.getSource(initialstate.source_id);

                    if (initialstate.path.length == 0){
                        continue;
                    }

                    path = new Path({
                        id: n,
                        announcedPath: initialstate.path.join(" "),
                        target: target,
                        source: source,
                        environment: environment
                    });
                    uniquePath[source.id + "-" + target.id] = path;

                    tmpPath = initialstate.path;

                    tmpNode = bgplay.getNode(tmpPath[tmpPath.length - 1]);
                    tmpNode.addTarget(target); //In this way we can check hijacking
                    if (!arrayContains(target.get("nodes"), tmpNode)){
                        target.addNode(tmpNode);
                    }

                    length2 = tmpPath.length;
                    for (i= 0; i<length2; i++){
                        if (!tmpPath[i-1] || tmpPath[i-1] != tmpPath[i]){
                            path.addNode(bgplay.getNode(tmpPath[i]));
                        }
                    }
                    event = new Event({
                        subType: "initialstate",
                        type: "initialstate",
                        source: source,
                        target: target,
                        path: path,
                        instant: bgplay.get("cur_instant"),
                        environment: environment
                    });
                    source.addEvent(event);
                    bgplay.get("allEvents").put(bgplay.get("cur_instant"), event);
                }

                return uniquePath;
            }

            function createEvents(uniquePath, wrap){
                var eventId = 1;
                var events, event, n, i, length2, tmpNode, instant, eventType, currentPath, attributes, shortdescription,
                    source, longdescription, path, target, tmpEvent, prevPath, tmpPath, subType, numNotValidWithdrawal, length;
                var ignoreReannouncements = environment.params.ignoreReannouncements;
                var pathStartId = uniquePath.length;

                numNotValidWithdrawal = 0;

                events = wrap.events;
                length = events.length;
                for (n=0; n<length; n++){
                    event = events[n];
                    eventType = event.type;
                    attributes = event.attrs;
                    source=bgplay.getSource(attributes.source_id);
                    target=bgplay.getTarget(attributes.target_prefix);

                    prevPath = uniquePath[source.id + "-" + target.id];

                    if (eventType=='W' && prevPath==null){
                        numNotValidWithdrawal++;
                        continue;
                    }

                    if (attributes.path!=null && attributes.path.length==0){
                        continue;
                    }

                    currentPath = (attributes.path) ? attributes.path.join(" ") : "";
                    instant = new Instant({
                        id:eventId,
                        timestamp: event.timestamp,
                        environment:environment
                    });
                    path = new Path({
                        id: pathStartId,
                        announcedPath: currentPath,
                        target: target,
                        source: source,
                        environment: environment
                    });//n is a good id (must be integer)
                    pathStartId++;
                    tmpEvent = new Event({
                        source: source,
                        target: target,
                        type: event.type,
                        instant: instant,
                        community: (attributes.community) ? attributes.community.join(",") : null,
                        environment: environment
                    });
                    tmpPath = attributes.path;

                    if (eventType=='W' && prevPath!=null){
                        shortdescription = "The route "+ prevPath.toString()+" has been withdrawn.";
                        longdescription = "The route "+ prevPath.toString()+" has been withdrawn...more";
                        subType = "withdrawal";
                        tmpEvent.attributes.path = null;
                    }else if (eventType=='A' || eventType=='B'){

                        tmpNode = bgplay.getNode(tmpPath[tmpPath.length-1]);
                        tmpNode.addTarget(target);//In this way we can check hijacking
                        if (!arrayContains(target.get("nodes"),tmpNode)){
                            target.addNode(tmpNode);
                        }

                        length2 = tmpPath.length;

                        for (i=0; i<length2; i++){
                            if (!tmpPath[i-1] || tmpPath[i-1]!=tmpPath[i])
                                path.addNode(bgplay.getNode(tmpPath[i]));
                        }

                        if (prevPath==null){
                            shortdescription = "The new route "+ path.get('announcedPath')+" has been announced";
                            longdescription = "The new route "+ path.get('announcedPath')+" has been announced..more";
                            subType = "announce";
                            tmpEvent.attributes.path = path; //The new path
                        }else{
                            if (prevPath.toString()==path.toString()){
                                if (prevPath.get('announcedPath')==path.get('announcedPath')){
                                    if (!ignoreReannouncements){
                                        shortdescription = "The route "+ prevPath.get('announcedPath')+" has been announced again";
                                        longdescription = "The route "+ prevPath.get('announcedPath')+" has been announced again..more";
                                        subType = "reannounce";
                                        tmpEvent.attributes.path = prevPath; //The previous path
                                    }else{
                                        continue; //skip re-announcements
                                    }
                                }else{
                                    shortdescription = "The route "+ prevPath.get('announcedPath')+" introduced/removed prepending "+path.get('announcedPath');
                                    longdescription = "The route "+ prevPath.get('announcedPath')+" introduced/removed prepending "+path.get('announcedPath')+" ..more";
                                    subType = "prepending";
                                    tmpEvent.attributes.path = path;
                                }
                            }else{
                                shortdescription = "The route "+ prevPath.get('announcedPath')+" is changed to "+path.get('announcedPath');
                                longdescription = "The route "+ prevPath.get('announcedPath')+" is changed to "+path.get('announcedPath')+" ..more";
                                subType = "pathchange";
                                tmpEvent.attributes.path = path;//The new path
                            }
                        }
                    }
                    uniquePath[source.id+"-"+target.id] = tmpEvent.attributes.path;
                    tmpEvent.attributes.shortdescription = shortdescription;
                    tmpEvent.attributes.longdescription = longdescription;
                    tmpEvent.attributes.prevPath = prevPath;
                    tmpEvent.attributes.subType = subType;
                    source.addEvent(tmpEvent);
                    bgplay.get("allEvents").put(instant,tmpEvent);
                    eventId++;
                }

                if (numNotValidWithdrawal>0){
                    // if (numNotValidWithdrawal == 1){
                    //     environment.cssAlert.alert("A withdrawal applied to a not existent path","warning",3000);
                    // }else{
                    //     environment.cssAlert.alert(numNotValidWithdrawal+"  withdrawals ignored: no referenced path","warning",3000);
                    // }
                }

                return [uniquePath, pathStartId];
            }

            createNodes(wrap);
            createSources(wrap);
            createTargets(wrap);
            var expose = createEvents(createInitialState(wrap), wrap);

            environment.uniquePath = expose[0];
            environment.pathStartId = expose[1];



            bgplay.updateState();

            return true;
        }
    }
}
