!function(global){
	var delegate = global.delegate = function delegate(){
		if (!(this instanceof delegate)){
			return new delegate(arguments);
		}
		this.delegates = [];
	};

	delegate.delegate = function(obj, delegate, map){
		return obj.delegates.push({
			obj: delegate,
			map: map
		}); /* handle */
	};

	delegate.prototype = {
		delegate: function(receiver, map){
			return delegate.delegate(this, receiver, map);
		},
		emit: function(event){
			var args = Array.prototype.slice.call(arguments, 1);
			this.delegates.forEach(function(delegate){
				if (delegate){
					var e = (delegate.map && delegate.map[event]) ? delegate.map[event] : event;
					var f = typeof e === 'function' ? e : delegate.obj[e];
					f && f.apply(delegate.obj, args);
				}
			});
		},
		removeDelegate: function(handle){
			handle--; // Handle is the array length not the position
			// TODO: This way we're building a bloated array in the long term
			// Maybe we should use a hash as a delegate identifier?
			if (this.delegates[handle]){
				delete this.delegates[handle];
			}
		}
	};
}(window);
