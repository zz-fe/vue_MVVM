function computed() { //具有缓存功能
    let computed = this.$options.computed;  // {key:value}
    let self = this
    Object.keys(computed).forEach(function(key){   //拿到key 值
      Object.defineProperty(self, key,{
        get: typeof computed[key] === 'function' ?  computed[key] : computed[key].get,
        set(){},
      })
    })
}
