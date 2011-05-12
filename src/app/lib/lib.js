!function(global){
	var mixin = global.mixin = function(obj, props){
		for (var prop in props){
			obj[prop] = props[prop];
		}
	}
}(window);
