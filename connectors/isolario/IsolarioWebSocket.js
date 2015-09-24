/*
* The code in this file is part of the isolario project and has been provided by the isolario team to Massimo Candela for the
* integration of BGPlay real-time with their streaming service.
* The code is slightly adjusted, but the entire copyright of this file remains of isolario.it
*/
var WS_KEEPALIVE_INTERVAL = 10000;
var WS_SEND_OK = 1;
var WS_SEND_ERROR = -1;
var SERVER_KEEPALIVE = "0\0";
var SERVER_TIMEOUT_INTERVAL = 30000; // ms should be at least three times greater than the interval at which the server sends keepalives, i.e. 10 seconds

function IsolarioWebSocket(param) {
    // constructor parameters
    this.app_name = param.app_name;
    this.post_open = param.post_open;
    this.post_send_app = param.post_send_app;
    this.post_token = param.post_token;
    this.handle_message = param.handle_message;
    this.app_url = (param.app_url !== undefined) ? param.app_url : base_app_url+"/"+this.app_name;
    this.loader = param.loader;
    this.onerror_do = param.onerror_do;
    this.ignore_error = (param.ignore_error != undefined) ? param.ignore_error : false;
    this.first = true;
    this.onclose_do = param.onclose_do;
    this.token = param.token;

    this.last_server_keepalive = 0;
    this.pending_error = 0;
        
      // handle gracefulWebSocket callbacks
    
    this.ws = $.gracefulWebSocket(this.app_url);
    var self = this;
    this.ws.onopen = function(event) { self.onopen(event); };
    this.ws.onclose = function (event) { self.onclose(event); };
    this.ws.onerror = function (event)  { self.onerror(event); };
}

IsolarioWebSocket.prototype.close = function() {
    this.ws.close();
};

IsolarioWebSocket.prototype.check_and_send = function(message) {
    if (this.ws.readyState == this.ws.OPEN) {
        this.ws.send(message);
        return WS_SEND_OK;
    }
    return WS_SEND_ERROR;
};

IsolarioWebSocket.prototype.onopen = function(event) {
    window.clearInterval(this.loaderTimeout);
    setTimeout(this.send_app.bind(this), 1000);

    if(typeof this.post_open == 'function')
        this.post_open();
};

IsolarioWebSocket.prototype.onclose = function(event) {

    if (this.pending_error > 0) {
        if (this.onerror_do == undefined && !this.ignore_error) {
            show_error(this.pending_error);
        }
        else if (this.onerror_do.error == this.pending_error)
            this.onerror_do.func();
    } else if (typeof this.onclose_do === "function") {
        this.onclose_do();
    }
};

IsolarioWebSocket.prototype.onerror = function(event){

    if (!this.ignore_error)
        show_error(APP_NOT_AVAILABLE);
};

IsolarioWebSocket.prototype.send_app = function() {
    var token = (this.token === undefined) ? $('input[name=token]').val() : this.token;
    this.check_and_send(token+"\0");
 
    if( typeof this.post_token == 'function')
        this.post_token(); 

    var self = this;
    this.ws.onmessage = function (event) { self.onmessage(event); }
    
    if( this.pending_error == 0 && typeof this.post_send_app == 'function') {
        this.post_send_app();
    }
};

IsolarioWebSocket.prototype.onmessage = function(event) {
    // on message...
    var messageFromServer = event.data;
    
    this.record_server_keepalive();

    if (messageFromServer == SERVER_KEEPALIVE) {
        return;
    }
    
    var parts = messageFromServer.split('@');
    
    if (error(parts[0]) != 0) {
        this.pending_error = parts[0];
        this.ws.close();
        return;
    }
    var $this = this;
    if (this.first) {
        this.first = false;
        setInterval(this.send_keepalive.bind(this), WS_KEEPALIVE_INTERVAL);
        setInterval(function(){
            $this.check_expired_server();
        }, SERVER_TIMEOUT_INTERVAL);
    }
    
    if (typeof this.handle_message == 'function' ) {
        this.handle_message(parts);
    } else {
        console.log("ERROR", "handle_message() function does not exists.");
    }
};

IsolarioWebSocket.prototype.send_keepalive = function() {
    if (this.ws.readyState != this.ws.OPEN)
        return;
    this.ws.send("0\0");
};


IsolarioWebSocket.prototype.record_server_keepalive = function() {
    this.last_server_keepalive = new Date().valueOf(); // now
};

IsolarioWebSocket.prototype.check_expired_server = function() {
    var now = new Date().valueOf();
    if (now - this.last_server_keepalive  > SERVER_TIMEOUT_INTERVAL) {
        this.pending_error = SERVER_EXPIRED;
        this.stopAllTimeouts();
    }
};

IsolarioWebSocket.prototype.stopAllTimeouts = function() {
    var id = window.setTimeout(null, 0);
    while (id--) {
        window.clearTimeout(id);
    }
};

