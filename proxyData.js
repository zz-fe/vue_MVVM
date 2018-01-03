function proxyData(data,vm){
    for(let key in data ) {
        Object.defineProperty(vm, key ,{
            enumerable:true, 
            get() {
                return this._data[key];
            },
            set(newValue){
                this._data[key] = newValue
            }
        })
    } 
}