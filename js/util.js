/**
 * Utility methods
 *
 * @category   HTML
 * @package    Ajax
 * @author     David Coallier <davidc@php.net>
 * @copyright  2005 David Coallier
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */
// {{{ HTML_AJAX_Util
/**
 * All the utilities we will be using thorough the classes
 */
var HTML_AJAX_Util = {
    // Set the element event
    setElementEvent: function(id, event, handler) {
        var element = document.getElementById(id);
        if (typeof element.addEventListener != "undefined") {   //Dom2
           element.addEventListener(event, handler, false);
        } else if (typeof element.attachEvent != "undefined") { //IE 5+
            element.attachEvent("on" + event, handler);
        } else {
            if (element["on" + event] != null) {
                var oldHandler = element["on" + event];
                element["on" + event] = function(e) {
                    oldHander(e);
                    handler(e);
                };
            } else {
                element["on" + event] = handler;
            }
        }
    }
}
// }}}
