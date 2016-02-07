/**
 * Author: Massimo Candela
 * Date: 05/09/2015
 * Please refer to LICENSE.txt for information about the license.
 */


var StreamingFacade = function(environment){
    var cachedSources, socket, $this, cache, dump, endOfDumpTimer;

    dump = true;
    this.dump = {
        query_starttime: Infinity,
        query_endtime: 0,
        initial_state: [],
        sources: [],
        nodes: [],
        events: [],
        targets: []
    };
    cachedSources = {};
    cache = {
        sources: {},
        nodes: {},
        targets: {}
    };
    $this = this;

    this._postConnection = function(){
        if ($this.options.onConnect){
            $this.options.onConnect();
        }
    };

    this._getAsPath = function(asPathElements, ownersArray){
        var out;

        out = [];
        for (var n=0,length=asPathElements.length; n<length; n++){
            out.push({
                owner: ownersArray[n],
                as_number: asPathElements[n]
            });
        }

        return out;
    };

    this._getSource = function(asn, ip, rrc){
        var sourceId;

        sourceId = rrc + "-" + ip;
        if (!cachedSources[sourceId]){
            cachedSources[sourceId] =  {
                "as_number": asn,
                "rrc": rrc,
                "id": sourceId,
                "ip": ip
            }
        }

        return cachedSources[sourceId];
    };

    this._getTarget = function(prefix){
        return {
            prefix: prefix
        }
    };

    this._convertToJson = function(sample){
        var type, payload, asPathElements, ownersArray;

        if (!endOfDumpTimer){
            endOfDumpTimer = setTimeout(this._endOfDump, 15000); // Force end of dump
        }
        type = sample.type;
        switch (type) {
            case "dump":
                asPathElements = sample.as_path;
                ownersArray = [];

                if (environment.config.graph.hideDefaultRoutes && asPathElements.length > 1 && sample.prefix != "0.0.0.0/0"){ // default route
                    payload = {
                        type: "dump",
                        timestamp: sample.timestamp,
                        path: this._getAsPath(asPathElements, ownersArray),
                        source: this._getSource(asPathElements[0], sample.router, "bgpstream"),
                        target: this._getTarget(sample.prefix) ,
                        community: sample.communities
                    };
                }
                break;

            case "A":
                asPathElements = sample.as_path;
                ownersArray = [];

                if (environment.config.graph.hideDefaultRoutes && asPathElements.length > 1 && sample.prefix != "0.0.0.0/0"){ // default route
                    payload = {
                        type: "A",
                        timestamp: sample.timestamp,
                        path: this._getAsPath(asPathElements, ownersArray),
                        source: this._getSource(asPathElements[0], sample.router, "bgpstream"),
                        target: this._getTarget(sample.prefix) ,
                        community: sample.communities
                    };
                }
                break;

            case "W":
                payload = {
                    type: "W",
                    timestamp: sample.timestamp,
                    source: this._getSource(null, sample.router, "bgpstream"),
                    target: this._getTarget(sample.prefix)
                };
                break;

            default:
                return;
                break;
        }

        return payload;
    };

    this._endOfDump = function(){
        if (endOfDumpTimer){
            clearTimeout(endOfDumpTimer);
        }
        if ($this.options.onDump && $this.dump && $this.dump.initial_state.length > 0){
            $this.options.onDump($this.dump);
        } else {
            alert("No one of our feeders is able to see this prefix.");
        }

        dump = false;
    };


    this._handleMessage = function(data){
        var jsonMessage;

        jsonMessage = this._convertToJson(data);
        console.log(jsonMessage);
        if (jsonMessage){
            if (dump){
                this._enrichDump(jsonMessage);
            } else {
                if (jsonMessage.type == "dump"){ // For late dump lines
                    jsonMessage.type = "A";
                }
                if (this.options.onEvent && environment.bgplay){
                    this.options.onEvent(jsonMessage);
                }
            }
        }
    };

    this._enrichDump = function(item){
        var node, path;

        this.dump.query_starttime = Math.min(this.dump.query_starttime, item.timestamp);
        this.dump.query_endtime = Math.max(this.dump.query_endtime, item.timestamp);
        this.dump.resource = item.target.prefix;

        if (!cache.sources[item.source.id]){
            this.dump.sources.push(item.source);
            cache.sources[item.source.id] = true;
        }

        if (!cache.targets[item.target.prefix]){
            this.dump.targets.push(item.target);
            cache.targets[item.target.prefix] = true;
        }

        if (item.path){
            for (var n=0,length=item.path.length; n<length; n++){
                node = item.path[n];
                if (!cache.nodes[node.as_number]){
                    this.dump.nodes.push(node);
                    cache.nodes[node.as_number] = true;
                }
            }

            path = $.map(item.path, function(node){return node.as_number;});
        }

        if (item.type == "dump"){
            this.dump.initial_state.push({
                source_id: item.source.id,
                path: path || [],
                //community: null,
                target_prefix: item.target.prefix
            });
        } else {
            for (var n=0,length=this.dump.initial_state.length; n<length; n++){
                var routingTableLine = this.dump.initial_state[n];
                if (routingTableLine.source_id == item.source.id && routingTableLine.target_prefix == item.target.prefix){

                    this.dump.initial_state.splice(n, 1);

                    if (item.type == "A"){
                        this.dump.initial_state.push({
                            source_id: item.source.id,
                            path: path || [],
                            //community: null,
                            target_prefix: item.target.prefix
                        })
                    }

                    break;
                }
            }
        }

    };

    this.connect = function(options){
        $this.options = options;

        socket = io(environment.defaultParams.streamingServerUrl, { path : "/socket.io" });
        socket.on("connect", $this._postConnection);
    };

    this.subscribe = function(query){
        console.log(query);

        socket.emit("bgp_subscribe", { prefix: query.targets });

        socket.on("bgp_dumpLine", function(data){
            console.log(data);
            $this._handleMessage(data);
        });

        socket.on("bgp_update", function(data){
            $this._handleMessage(data);
        });

        socket.on("bgp_error", function(data){
            $this._handleMessage(data);
        });

        socket.on("bgp_endOfDump", function(){
            $this._endOfDump();
        });

    };


};


