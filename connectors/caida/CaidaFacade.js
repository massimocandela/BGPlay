/**
 * Author: Massimo Candela
 * Date: 21/10/2015
 * Please refer to LICENSE.txt for information about the license.
 */


var StreamingFacade = function(environment){
    var cachedSources, socket, $this, cache, dump, endOfDumpTimer;

    //options = {
    //    onEvent: function,
    //    onConnect: function,
    //    onDump: function,
    //}

    dump = true; // for now
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


    this._handleMessage = function(sample){
        var jsonMessage;

        jsonMessage = sample; // caida uses socket.io and real json!
        console.log(jsonMessage);

        if (jsonMessage){
            if (dump){
                this._enrichDump(jsonMessage);

                this._endOfDump(); //  REMOVE

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
        var url;
        $this.options = options;


        url = environment.defaultParams.streamingServerUrl;
        socket = io.connect(url);

        socket.on('bgp_message', function(msg){
            $this._handleMessage(msg);
        });

        socket.on('connect', this._postConnection);

    };



    this.subscribe = function(query){
        var matchType;

        switch (environment.defaultParams.prefixMatch){
            case 1:
                matchType = "more-specific";
                break;

            case 0:
                matchType = "exact-match";
                break;

            case -1:
                matchType = "less-specific";
                break;

            default:
                matchType = "exact-match";

                break;
        }

        socket.emit('bgp_subscribe', {
            //omitting resource gives us everything
            //resource: query,
            sendDump: false,
            enrichPaths: false,
            matchType: matchType
        });
    }


};


