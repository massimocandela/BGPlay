/**
 * Author: Massimo Candela
 * Date: 05/09/2015
 * Please refer to LICENSE.txt for information about the license.
 */


var StreamingFacade = function(environment){
    var cachedSources, socket, $this, cache, dump;

    //options = {
    //    onEvent: function,
    //    onConnect: function,
    //    onDump: function,
    //}

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

        type = sample[1];
        switch (type) {
            case "255":
                asPathElements = sample[4].split(" ");
                ownersArray = sample[9].split("|");
                payload = {
                    type: "dump",
                    timestamp: parseInt(sample[10]),
                    path: this._getAsPath(asPathElements, ownersArray),
                    source: this._getSource(asPathElements[0], sample[2], "isolario"),
                    target: this._getTarget(sample[3]) ,
                    community: sample[8]
                };
                break;

            case "1":
                asPathElements = sample[4].split(" ");
                ownersArray = sample[9].split("|");
                payload = {
                    type: "A",
                    timestamp: parseInt(sample[10]),
                    path: this._getAsPath(asPathElements, ownersArray),
                    source: this._getSource(asPathElements[0], sample[2], "isolario"),
                    target: this._getTarget(sample[3]) ,
                    community: sample[8]
                };
                break;

            case "2":
                payload = {
                    type: "W",
                    timestamp: parseInt(sample[4]),
                    source: this._getSource(null, sample[2], "isolario"),
                    target: this._getTarget(sample[3])
                };
                break;

            default:
                return;
                break;
        }

        return payload;
    };

    this._endOfDump = function(){
        if ($this.options.onDump){
            $this.options.onDump($this.dump);
        }
    };

    this._endOfFeedersList = function(){

    };

    this._handleMessage = function(sample){
        var jsonMessage, code;

        code = sample[1];
        switch (code) {
            case "255": // dump
                jsonMessage = this._convertToJson(sample);
                if (!dump){
                    jsonMessage.type = "A";
                }
                break;

            case "1": // update
                jsonMessage = this._convertToJson(sample);
                break;

            case "2": // withdrawal
                jsonMessage = this._convertToJson(sample);
                break;

            case "-2": // end of feeders list
                this._endOfFeedersList();
                break;

            case "4": // end of dump
                this._endOfDump();
                dump = false;
                break;

            case "-1": // feeders list item
                //ignore
                break;

            case "0": // partial end of dump
                //ignore
                break;


            default:
                console.log("I don't understand this message", sample);
        }


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

        socket = new IsolarioWebSocket({
            app_url : "ws://146.48.78.3:9999/my_subnet_reachability",
            handle_message : function(data){$this._handleMessage.call($this, data)},
            post_send_app : function(data){$this._postConnection.call($this, data)},
            token: environment.defaultParams.authenticationToken
        });
    };

    this.subscribe = function(query){
        socket.check_and_send("50@" + query.targets);
    }


};


