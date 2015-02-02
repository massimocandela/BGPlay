/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * This is a module specific for BGP.
 * The objective of this module is to provide a set of auto-start function for checking BGP data.
 * @class BgpDataChecksView
 * @module modules
 */
define([],  function(){


    var BgpDataChecksView = Backbone.View.extend({

        /**
         * The initialization method of this object.
         * @method initialize
         * @param {Map} A map of parameters
         */
        initialize:function(){
            this.environment=this.options.environment;
            this.bgplay=this.environment.bgplay;
            this.fileRoot=this.environment.fileRoot;
            this.eventAggregator=this.environment.eventAggregator;



            this.eventAggregator.trigger("autoStartFunction",
                {func:
                              function(){
                                  var nodes, realPrefixes, prefixes, n, length, notFoundPrefixes, targets, environment;
                                  environment = this.environment;
                                  //prefixes = stringToArray(environment.params.targets);
                                  //realPrefixes = environment.bgplay.getPrefixes();

                                  environment.bgplay.get("targets").each(function(target){
                                      if (target.get("nodes").length>1){
                                          environment.cssAlert.alert("The prefix "+target.get("id")+" is announced by more than one AS: " + arrayToString(target.get("nodes"),', '),"warning",3000);
                                      }
                                  });

                                  /*
                                   for (n=0, length=prefixes.length; n<length; n++){
                                   if (!arrayContains(realPrefixes, prefixes[n])){
                                   notFoundPrefixes[prefixes.length] = prefixes[n];
                                   }
                                   }

                                   if (notFoundPrefixes.length == 1){
                                   environment.cssAlert.alert("No data was found for prefix " + notFoundPrefixes[0] + ".","info",1000);
                                   }else if (notFoundPrefixes.length > 1){
                                   environment.cssAlert.alert("No data was found for prefixes " + arrayToString(notFoundPrefixes, ', ') + ".","info",1000);
                                   }
                                   */
                              }
                    , context:this});

            this.eventAggregator.trigger("moduleLoaded", this);
        }
    });

    return BgpDataChecksView;
});
