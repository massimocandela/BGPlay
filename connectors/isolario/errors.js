var ISOLARIO_WEBSOCKET_DUPLICATE_ENTRY = 255;
var ISOLARIO_WEBSOCKET_HANDSHAKE_ERROR = 254;
var ISOLARIO_WEBSOCKET_TOKEN_ERROR = 253;
var ISOLARIO_WEBSOCKET_AUTHENTICATION_ERROR = 252;
var ISOLARIO_WEBSOCKET_PERMISSION_ERROR = 251;
var ISOLARIO_WEBSOCKET_DUPLICATE_CONNECTION = 250;
var ISOLARIO_PARAMETER_ERROR = 249;
var ISOLARIO_EXPIRED_GUEST = 248;
var APP_NOT_AVAILABLE = 256;
var SERVER_EXPIRED = 257;
var FEEDER_DEATH_ERROR = 258;

var error_pool = [ISOLARIO_WEBSOCKET_DUPLICATE_ENTRY,
ISOLARIO_WEBSOCKET_HANDSHAKE_ERROR,
ISOLARIO_WEBSOCKET_TOKEN_ERROR,
ISOLARIO_WEBSOCKET_AUTHENTICATION_ERROR,
ISOLARIO_WEBSOCKET_PERMISSION_ERROR,
ISOLARIO_WEBSOCKET_DUPLICATE_CONNECTION,
ISOLARIO_PARAMETER_ERROR, APP_NOT_AVAILABLE];

var NO_ERROR = 0;

function str_app_error(error_code)
{
    switch(parseInt(error_code)) {
        case ISOLARIO_WEBSOCKET_HANDSHAKE_ERROR:
            return "There was an error during websocket handshake. \
            Please retry, if the error persists, contact the Isolario staff.";
        case ISOLARIO_WEBSOCKET_TOKEN_ERROR:
        case ISOLARIO_WEBSOCKET_AUTHENTICATION_ERROR:
            return "There was an error during the authentication of your \
            connection. Please retry. If the error persists, contact the \
            Isolario staff.";
        case ISOLARIO_WEBSOCKET_PERMISSION_ERROR:
            return "You don't have the permission to access this application.\
            If this is a mistake, please do not hesitate to contact the\
            Isolario staff";
        case ISOLARIO_WEBSOCKET_DUPLICATE_ENTRY:
        case ISOLARIO_WEBSOCKET_DUPLICATE_CONNECTION:
            return "You are already connected to this application (probably in\
            the same browser but in a different tab)";
        case ISOLARIO_PARAMETER_ERROR:
            return "There was a problem in processing the request. Please \
            retry. If the error persists contact the Isolario staff.";
        case APP_NOT_AVAILABLE:
            return "The application is not available at the moment. Please \
            check the 'Staff communication' in the home page or contact the \
            Isolario staff";
        case SERVER_EXPIRED:
            return "The connectivity with the server has been lost. Please check\
             your connectivity and retry. If the error persists please contact\
             the Isolario staff";
        case FEEDER_DEATH_ERROR:
            return "The feeder gone down";
        case ISOLARIO_EXPIRED_GUEST:
            return "The demo session for this application has been expired.";
        default:
            return "An unknown error occurred. Please retry. If this message\
            persists, please contact the Isolario staff"; 
    }
}

function show_feeder_death_error(feeder_ip, function_ok) {
    var msg = "Error with feeder "+feeder_ip+": "+str_app_error(FEEDER_DEATH_ERROR);
    show_modal("ERROR", msg, function_ok);
}

function show_error(error_code, function_ok)
{
    console.log(str_app_error(error_code));
}

function error(error_code)
{
    if (isNaN(error_code))
        return false;
        
    var c = parseInt(error_code);
    var index = $.inArray(c, error_pool);
    return (index != -1) ? error_pool[index] : 0; 
}

function check_message(parts, expected_len)
{
    if (parts.length < expected_len) {
        console.log("Received malformed message, expected parts length: "+expected_len+", message parts length is "+parts.length+" ["+parts.join("@")+"]");
        return false;
    }
    return true;
}
