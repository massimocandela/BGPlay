var REFRESH_INTERVAL = 10000; // ten seconds
var REFRESH_ALERT_INTERVAL = 60000; // a minute, refresh the alerting status
var closeBrowserTabMessage = "NOTE: If you leave this page, all the data fetched by the application so far will be deleted";


// convert the epoch time in date considering the timezone (offset)
var TYPE_XML = 1;
var TYPE_CSV = 2;
var TYPE_JSON = 3;

var AVAIL_FEEDER = -1;
var AVAIL_FEEDER_END = -2;

var APP_TIMEOUT = 86400000;

var SERVER_KEEPALIVE = "0\0";
var last_server_keepalive = 0;
var server_expired = 0;
var pending_error = 0;
const SERVER_TIMEOUT_INTERVAL = 30000; // ms should be at least three times greater than the interval at which the server sends keepalives, i.e. 10 seconds

/*
    Records the timestamp of the last message received from the server.
    It sets last_server_keepalive to the current epoch time.
    This function shall be called by the client whenever it recives a message
    from the server. 
*/
function record_server_keepalive()
{
    last_server_keepalive = new Date().valueOf(); // now
}

/*
    Checks if the connectivity of the server is expired.
    If "now" minus last_keepalive is greater than the timeout, then the
    websocket is closed. pending_error is set to SERVER_EXPIRED.
    
    This function shall be called at regular intervals by the client. Such
    intervals should be SERVER_TIMEOUT_INTERVAL.
    
    So, for example if SERVER_TIMEOUT_INTERVAL is 30000, this means that every
    30 seconds this function checks the timestamp at which the last keepalive
    was received. If the connection is alive, a keepalive from the
    server is received every 10 seconds (which is 1/3 of the default value of SERVER_TIMEOUT_INTERVAL)
    so there should not be problems.
    
*/
function check_expired_server()
{
    var now = new Date().valueOf();
    if (now - last_server_keepalive  > SERVER_TIMEOUT_INTERVAL) {
        pending_error = SERVER_EXPIRED;
        stopAllTimeouts();
        show_error(pending_error, show_home_page);
    }
}

function stopAllTimeouts()
{
    var id = window.setTimeout(null,0);
    while (id--) 
    {
        window.clearTimeout(id);
    }
}

function show_alert(title, message){
   
    
      var button_ok = $('<button type="button" class="btn btn-primary" data-dismiss="modal">Ok</button>');
      var ob = $('<div class="modal fade">\
      <div class="modal-dialog modal-sm">\
        <div class="modal-content">\
          <div class="modal-header">\
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
            <h4 class="modal-title">'+title+'</h4>\
          </div>\
          <div class="modal-body">\
            <p>'+message+'</p>\
          </div>\
          <div class="modal-footer">\
          </div>\
        </div>\
      </div>\
    </div>');

   
    $(ob).find(".modal-footer").append(button_ok);
    $(ob).modal();
}


/* 
    Shows an "info" dialog with a button "OK"
    
    When "Ok" is pressed, then the function "function_ok" is executed, if supplied.
    For more info and an example see show_confirm description.
*/
function show_modal(title, message, function_ok) {
}

/* 
    Shows a "confirm" dialog with a button "OK" and a button "Cancel"
    
    If "Ok" is pressed, then the function "function_ok" is executed.
    If "Cancel" is pressed, then the function "function_cancel" is pressed.
    
    "function_ok" and "function_cancel" are supplied by the user.
    
    It is not mandatory to supply them. They are executed only if they are
    defined.
    
    Example:
    
    show_confirm("Confirm", "Are you sure?",
        function() {
                alert("You pressed Ok");            
        },
        function() {
                alert("You pressed Cancel");            
        }
    );

*/
function show_confirm(title, message, function_ok, function_cancel)
{
    var button_ok = $('<button type="button" class="btn btn-primary" data-dismiss="modal">Ok</button>');
    var button_cancel = $('<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>');
    
    var ob = $('<div class="modal fade">\
      <div class="modal-dialog modal-sm">\
        <div class="modal-content">\
          <div class="modal-header">\
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
            <h4 class="modal-title">'+title+'</h4>\
          </div>\
          <div class="modal-body">\
            <p>'+message+'</p>\
          </div>\
          <div class="modal-footer">\
          </div>\
        </div>\
      </div>\
    </div>');

    if (typeof function_ok === 'function')
        $(button_ok).bind('click', function_ok);
    
    if (typeof function_cancel === 'function')
        $(button_cancel).bind('click', function_cancel);
    
    $(ob).find(".modal-footer").append(button_ok);
    $(ob).find(".modal-footer").append(button_cancel);
    
    $(ob).modal();
}

function show_rt_service_index_page()
{
    location.replace(base_url+"/service/pages/real_time_service_index.php");
}

function show_home_page()
{
    location.replace(base_url+"/service/pages/apps/home.php");
}




var escapable = /[\x00-\x1f\ud800-\udfff\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufff0-\uffff]/g;
function filterUnicode(quoted)
{
  escapable.lastIndex = 0;
  if( !escapable.test(quoted)) return quoted;
 
  return quoted.replace( escapable, function(a){
    return '';
  });
}


function get_date(epoch_time, offset)
{

    epoch_time = parseFloat(epoch_time);

    var udate = new Date(epoch_time*1000);
    var tz_offset = parseInt(udate.getTimezoneOffset()); 
    var h_offset = Math.abs(tz_offset)/60;
    epoch_time -= h_offset;
    var milli = epoch_time*1000;
    var date = new Date(parseFloat(milli));
    var hours = (tz_offset < 0) ? date.getHours() - h_offset : date.getHours() + h_offset;

    // if offset is set than the user has set his timezone
    // String.match() return null if it doesn't find a match
    if( offset != null){
           date.setHours( hours + parseInt(offset[0]) );
    }
    
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day  = date.getDate();
    
    var hour = date.getHours();
    var minu = date.getMinutes();
    var sec = date.getSeconds();
    
   
    if (month < 10)
        month = "0"+month;
    if (day < 10)
        day = "0"+day;
    if (hour < 10)
        hour = "0"+hour;
    if (minu < 10)
        minu = "0"+minu;
    if (sec < 10)
        sec = "0"+sec; 
   
    return year+"-"+month+"-"+day+" "+hour+":"+minu+":"+sec;

}

function timespan_to_integer(timespan)
{
    var sum = 0;
    if (timespan.match(/w/)) {
        parts = timespan.match(/(\d+)w(\d+)d(\d+)h(\d+)m/);
        sum += parts[1]*604800;
        sum += parts[2]*86400;
        sum += parts[3]*3600;
        sum += parts[4]*60;
    } else if (timespan.match(/d/)) {
        parts = timespan.match(/(\d+)d(\d+)h(\d+)m/);
        sum += parts[1]*86400;
        sum += parts[2]*3600;
        sum += parts[3]*60;
    } else if (timespan.match(/\:/)) {
        parts = timespan.split(/\:/);
        sum += parts[0]*3600;
        sum += parts[1]*60;
        sum += parts[2];   
    } else {
        parts = timespan.match(/(\d+)s/);
        if (parts && parts.length > 0)
            sum += parts[0];
        parts = timespan.match(/(\d+)m/);
        if (parts && parts.length > 0)
            sum += parts[0]*60;
        parts = timespan.match(/(\d+)h/);
        if (parts && parts.length > 0)
            sum += parts[0]*3600;
        parts = timespan.match(/(\d+)d/);
        if (parts && parts.length > 0)
            sum += parts[0]*86400;
        parts = timespan.match(/(\d+)w/);
        if (parts && parts.length > 0)
            sum += parts[0]*604800;
    }
    
    return parseInt(sum);
    
}

// e.g. date "July 1, 1978 02:30:00"
function to_epoch(date)
{
    var myDate = new Date(date); // Your timezone!
    return myDate.getTime()/1000.0;
}

function stretch_prefix(prefix)
{
    var res;
    if (prefix.match(/\./)) // IPv4
        res = 10*(18-prefix.length);
    else
        res = 7*(25-prefix.length); // approx 25...
    
    prefix = prefix.concat('<span style=padding-left:'+res+'px></span>');
    
    return prefix;
}


/* 
    Round a number to "n_decimal" decimal digits
    e.g. 
        num_round(3.257, 2) = 3.26
        num_round(3.257, 1) = 3.3
*/
function num_round(number, n_decimal)
{
    number = parseFloat(number) * Math.pow(10, n_decimal);
    number = Math.round(number);
    number = number / Math.pow(10, n_decimal);
    return number;
}

function reg_match(str, regexp)
{
    if (regexp.length == 0)
        return true;
    var r;
    try { 
        r = new RegExp(regexp); 
    } catch (err) { 
        return false 
    };
    return r.test(str);
}

/*
 * Original author:  Sandeep V. Tamhankar (stamhankar@hotmail.com)
 * old Source on http://www.jsmadeeasy.com/javascripts/Forms/Email%20Address%20Validation/template.htm
 * The above address bounces and no current valid address
 * can be found. This version has changes by Craig Cockburn
 * to accommodate top level domains .museum and .name
 * plus various other minor corrections and changes
 *
 * Italian translation by Giulio Chalda Bettega
*  http://blog.chalda.it/?p=11
 */

function emailCheck(emailStr) {
    var emailPat = /^(.+)@(.+)$/;
    var specialChars = "\\(\\)<>@,;:\\\\\\\"\\.\\[\\]";
    var validChars = "[^\\s" + specialChars + "]";
    var quotedUser = "(\"[^\"]*\")";
    var ipDomainPat = /^\[(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\]$/;
    var atom = validChars + "+";
    var word = "(" + atom + "|" + quotedUser + ")";
    var userPat = new RegExp("^" + word + "(\\." + word + ")*$");
    var domainPat = new RegExp("^" + atom + "(\\." + atom + ")*$");
    var matchArray = emailStr.match(emailPat);
    if (matchArray == null) {
        return false;
    }
    var user = matchArray[1];
    var domain = matchArray[2];
    if (user.match(userPat) == null) {
        return false;
    }
    var IPArray = domain.match(ipDomainPat);
    if (IPArray != null) {
        for (var i = 1; i <= 4; i++) {
            if (IPArray[i] > 255) {
                return false;
            }
        }
        return true;
    }
    var domainArray = domain.match(domainPat);
    if (domainArray == null) {
        return false;
    }
    var atomPat = new RegExp(atom, "g");
    var domArr = domain.match(atomPat);
    var len = domArr.length;
    if (domArr[domArr.length - 1].length < 2 ||
        domArr[domArr.length - 1].length > 6) {
        return false;
    }
    if (len < 2) {
        alert(errStr);
        return false;
    }
    return true;
}
//  End -->

function cobble_aspath(ref, aspath, context_menu)
{
    var ret = "";
    var ases = aspath.split(/\s/);
    for (i = 0; i < ases.length; i++) {
        if(!context_menu)
            ret += "<span class='as_info_tooltip "+escape_prefix(ref)+ases[i]+"' onmouseenter=\"request_as('"+ases[i]+"')\">"+ases[i]+"</span>";
        else
            ret += "<span class='as_info_tooltip "+escape_prefix(ref)+ases[i]+"' onmouseenter=\"request_as('"+ases[i]+"')\" oncontextmenu=\"open_context_menu('"+ases[i]+"')\" >"+ases[i]+"</span>";
        if (i < ases.length -1)
            ret += " ";
    }
    
    return ret;
}

function get_AT_tick()
{
    return "<img width=20 src='../../img/ok.png'/>";
}

function int_comparer(a, b)
{
    return ( parseInt(a) >= parseInt(b)) ? 1 : -1;
}

function alpha_comparer(a, b)
{
    return ( a >= b) ? 1 : -1;
}

function get_current_page()
{
    var path = window.location.pathname;
    var page = path.split("/").pop();
    return page;
}

function get_uid()
{
    return $("input[name=user_id]").val();
}

var download = false;
function download_summary_file(filename)
{
    /*$.post("download_summary.php", { userid: get_uid(), filename: filename },
       function(data){
         alert(data);
    });*/
    
    var a;
    if (is_firefox()) {
    a = "<form target='_blank' method='post' name='form_"+filename+"' action='download_summary.php'>\n"+
    "<input type='hidden' name='userid' value='"+get_uid()+"'>\n"+
    "<input type='hidden' name='file' value='"+filename+"'>\n"+
    "</form>\n";
    } else {
        a = "<form method='post' name='form_"+filename+"' action='download_summary.php'>\n"+
    "<input type='hidden' name='userid' value='"+get_uid()+"'>\n"+
    "<input type='hidden' name='file' value='"+filename+"'>\n"+
    "</form>\n";
    }
    $("body").append(a);
    
    var selector = "form[name='form_"+filename+"']";

    download = true;
      
    
    $(selector).submit();

    // remove the form
    $(selector).remove();
    
}

function get_type_from_filter_type(filter_type)
{
    if (filter_type == "prefix_sub")
        return "SUBNET";
    if (filter_type == "prefix_included")
        return "SUPERNET";
    if (filter_type == "prefix")
        return "EXACT";
     if (filter_type == "prefix_related")
        return "RELATED";
}

function get_origin_str(origin)
{
    if (origin == "i")
        return "igp";
    if (origin == "e")
        return "egp";
    if (origin == "?")
        return "incomplete";
    return origin;
}

function is_firefox()
{
    if ($.browser.mozilla)
        return true;
    return false;
}

// obscure a part of the page and show up a message
function obscure_page(message){

    // create a opaque canvas in full screen
    var canvas = document.createElement("canvas");
    canvas.id = "CanvasError";
    canvas.style.zIndex = 999;
    canvas.style.display = "block";
    canvas.style.position = "absolute";


    // retrieve the position and the size of the element which must be obfuscate 
    var width = $('.index_content').width();
    var height = $('.index_content').height();
    var position = $('.index_content').position();


    canvas.style.left = position.left+"px";
    canvas.style.top = position.top+"px";


    // set the dimension
    /* remember to set the same values on width and style.width
        otherwise everything will be scaled    
    */
    canvas.width  = width;
    canvas.height = height; 
    canvas.style.width  = width+"px";
    canvas.style.height = height+100+"px";

   
    canvas.style.margin = "0px";
    canvas.style.padding = "0px";

    document.body.appendChild(canvas);    

    var context = canvas.getContext('2d');

    context.save();


    // draw transparent black rectangle
    context.beginPath();
    context.rect(0, 0, width, height);
    context.fillStyle = "rgba(255, 255, 255, 0.5)";
    //context.globalAlpha = 0.5;
    context.fill();

    context.restore();
    context.save();

    // MESSAGE

    //context.restore();
    context.textAlign = 'center';
    context.textBaseline = "middle"; 
    context.fillStyle = 'black';
    context.font = 'bold 20px Verdana';  
    context.lineWidth = 1;

    var textWidth = context.measureText( message ).width;

    context.fillText(message, (canvas.width / 2) , (canvas.height/2)); 

}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

/*
    This function returns true if the two maps a1 and a2 are different.
    
    A "map" here is considered to be an *array of homogenous objects* 
    For example here is an example of a map with two objects.
        m = [{name: "goofy", kind: "dog"}, {name: "mickey", kind: "rat"}]
    
    
    Two maps are different if either one of teh following condition is satisfied:
        1) Their lengths are different (i.e. they contain a different number of objects)
        2) The objects are NOT in the same order
        3) At least one field of one object assume different values

*/

function map_difference(m1, m2)
{
    var l1 = Object.keys(m1).length;
    var l2 = Object.keys(m2).length;
    
    if (l1 != l2)
        return true;
    
    for (k in m1) { // for each object in m1
        for (var field in m1[k]) { // for each field in the current object
            if (m1[k][field] != m2[k][field])
                return true;
        }
    }
    
    return false;
}
