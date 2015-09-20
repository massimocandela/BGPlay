/**
 * Author: Max
 * Date: 20/09/2015
 * Please refer to LICENSE.txt for information about the license.
 */


define(
    [
        "errors.js",
        "IsolarioWebSocket.js",
        jquery
    ],  function(){

        var isolarioFacade = function(options){
            var cachedSources, socket;

            //options = {
            //    onEvent: function,
            //    onConnect: function,
            //    onDump: function,
            //}
            cachedSources = {};

            this.postConnection = function(){
                if (options.onConnection){
                    options.onConnection();
                }
            };

            this.getAsPath = function(asPathElements, ownersArray){
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

            this.getSource = function(asn, ip, rrc){
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

            this.getTarget = function(prefix){
                return {
                    prefix: prefix
                }
            };

            this.convertToJson = function(sample){
                var type, payload, asPathElements, ownersArray;

                type = sample[1];
                switch (type) {
                    case "255":
                        asPathElements = sample[4].split(" ").reverse();
                        ownersArray = sample[9].split("|").reverse();
                        payload = {
                            type: "dump",
                            timestamp: sample[10],
                            path: this.getAsPath(asPathElements, ownersArray),
                            source: this.getSource(asPathElements[0], sample[2], "isolario"),
                            target: this.getTarget(sample[3]) ,
                            community: sample[8]
                        };
                        break;

                    case "1":
                        asPathElements = sample[4].split(" ").reverse();
                        ownersArray = sample[9].split("|").reverse();
                        payload = {
                            type: "A",
                            timestamp: sample[10],
                            path: this.getAsPath(asPathElements, ownersArray),
                            source: this.getSource(asPathElements[0], sample[2], "isolario"),
                            target: this.getTarget(sample[3]) ,
                            community: sample[8]
                        };
                        break;

                    case "2":
                        payload = {
                            type: "W",
                            timestamp: sample[4],
                            source: this.getSource(null, sample[2], "isolario"),
                            target: this.getTarget(sample[3])
                        };
                        break;

                    default:
                        return;
                        break;
                }

                return payload;
            };

            this.endOfDump = function(){
                if (options.onDump){
                    options.onDump();
                }
            };

            this.endOfFeedersList = function(){

            };

            this.handleMessage = function(sample){
                var jsonMessage, code;

                code = sample[1];

                switch (code) {
                    case "255": // dump
                        jsonMessage = this.convertToJson(sample);
                        break;

                    case "1": // update
                        jsonMessage = this.convertToJson(sample);
                        break;

                    case "2": // withdrawal
                        jsonMessage = this.convertToJson(sample);
                        break;

                    case "-2": // end of feeders list
                        this.endOfFeedersList();
                        break;

                    case "0": // end of dump
                        this.endOfDump();
                        break;

                    case "-1": // feeders list item
                        //ignore
                        break;

                    case "4": // No one knows
                        //ignore
                        break;

                    default:
                        console.log("I don't understand this message", sample);
                }


                if (jsonMessage){
                    if (options.onEvent){
                        options.onEvent();
                    }
                }
            };

            this.connect = function(){
                socket = new IsolarioWebSocket({
                    app_url : "ws://146.48.78.3:9999/my_subnet_reachability",
                    handle_message : this.handleMessage,
                    post_send_app : this.postConnection,
                    token: "c065bef1aab26bcd2defb12811ac146cc29ef2e26d14257b5d555d4ce7908b8092039b884f7b6aff1f84994288c95fb364d4b34a61ad9e30188bb7d393525275",
                });
            };

            this.subscribe = function(query){
                socket.check_and_send("50@" + query);
            }


        };


        return isolarioFacade;
    });
