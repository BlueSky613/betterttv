var debug = require('debug');

module.exports = function () {
    debug.log("Turning Purple to Blue");

    var globalCSSInject = document.createElement("style");
    globalCSSInject.setAttribute("type", "text/css");
    globalCSSInject.setAttribute("id", "bttvBlueButtons");
    globalCSSInject.innerHTML = "#large_nav .game_filter.selected a { border-left: 4px solid #374a9b !important; } button.primary, .button-simple.primary, .primary_button:hover, .primary_button:focus, #subscribe_action .subscribe-text:hover, #subscribe_action .subscribe-text:focus { background: linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%) !important; background: -o-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%) !important; background: -moz-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%) !important; background: -webkit-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%) !important; background: -ms-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%) !important; } button.primary, .primary_button, #subscribe_action .subscribe-text {border-color: #000 !important;background: linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%) !important; background: -o-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%) !important; background: -moz-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%) !important; background: -webkit-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%) !important; background: -ms-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%) !important; }#team_member_list .page_links a, .page_links span.next_page b, .page_links a.next_page b, #main_col .messages div.preview.unread {border-left-color: #374a9b !important;}#team_member_list .page_links a b.left {border-left-color: #374a9b !important;}#team_member_list .page_links a b.right, .page_links span.previous_page b, .page_links a.previous_page b {border-right-color: #374a9b !important;}";
    $("body").append(globalCSSInject);
}