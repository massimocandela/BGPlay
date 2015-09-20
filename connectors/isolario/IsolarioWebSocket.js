var WS_KEEPALIVE_INTERVAL = 10000;
var WS_SEND_OK = 1;
var WS_SEND_ERROR = -1;

function IsolarioWebSocket(param) {
    console.log(param);
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
        
    if (this.loader == true)
        this.show_loader();
    
    // handle gracefulWebSocket callbacks
    
    this.ws = $.gracefulWebSocket(this.app_url);
    var self = this;
    this.ws.onopen = function(event) { self.onopen(event); }
    this.ws.onclose = function (event) { self.onclose(event); }
    this.ws.onerror = function (event)  { self.onerror(event); }
    
    this.was_opened = false;
}

IsolarioWebSocket.prototype.close = function()
{
    this.ws.close();
}

IsolarioWebSocket.prototype.show_loader = function() {


}

IsolarioWebSocket.prototype.close_loader = function()
{
    if (this.loader == true) {
        window.clearInterval(this.loaderTimeout);
    }
}


IsolarioWebSocket.prototype.check_and_send = function(message)
{
    if (this.ws.readyState == this.ws.OPEN) {
        this.ws.send(message);
        return WS_SEND_OK;
    }
    return WS_SEND_ERROR;
}

IsolarioWebSocket.prototype.onopen = function(event) {
    window.clearInterval(this.loaderTimeout);
    this.was_opened = true;
    setTimeout(this.send_app.bind(this), 1000);

    if(typeof this.post_open == 'function')
        this.post_open();
}

IsolarioWebSocket.prototype.onclose = function(event)
{

    if (pending_error > 0) {
        if (this.onerror_do == undefined && !this.ignore_error) {
            show_error(pending_error, show_home_page);
        }
        else if (this.onerror_do.error == pending_error)
            this.onerror_do.func();
    } else if (typeof this.onclose_do === "function") {
        this.onclose_do();
    }
}

IsolarioWebSocket.prototype.onerror = function(event)
{
    if (this.loader == true)
        this.close_loader();
    
    if (!this.ignore_error)
        show_error(APP_NOT_AVAILABLE, show_home_page);
}

IsolarioWebSocket.prototype.send_app = function()
{
    var token = (this.token === undefined) ? $('input[name=token]').val() : this.token;
    this.check_and_send(token+"\0");
 
    if( typeof this.post_token == 'function')
        this.post_token(); 

    if (this.loader == true){
        this.close_loader();
    }
    
    var self = this;
    this.ws.onmessage = function (event) { self.onmessage(event); }
    
    if( pending_error == 0 && typeof this.post_send_app == 'function') {
        // console.log("Calling when pending_error = "+pending_error);
        this.post_send_app();
    }
};

IsolarioWebSocket.prototype.onmessage = function(event)
{
    
    // on message...
    var messageFromServer = event.data;
    
    record_server_keepalive();

    if (messageFromServer == SERVER_KEEPALIVE) {
        //record_server_keepalive();
        return;
    }
    
    var parts = messageFromServer.split('@');
    
    if (error(parts[0]) != 0) {
        pending_error = parts[0];
        this.ws.close();
        return;
    }
    
    if (this.first) {
        this.first = false;
        setInterval(this.send_keepalive.bind(this), WS_KEEPALIVE_INTERVAL);
        setInterval(function(){
            check_expired_server();
        }, SERVER_TIMEOUT_INTERVAL);
    }
    
    if (typeof this.handle_message == 'function' ) {
        this.handle_message(parts);
    } else {
        console.log("ERROR", "handle_message() function does not exists.");
    }
}

IsolarioWebSocket.prototype.send_keepalive = function()
{
    if (this.ws.readyState != this.ws.OPEN)
        return;
    this.ws.send("0\0");
}
