function computed() { //具有缓存功能
    let computed = this.$options.computed;  // {key:value}
    Object.keys(computed).forEach(function(key){   //拿到key 值
      console.log(key)
      Object.defineProperty(this, key,{
        get: typeof computed[key] === 'function' ?  computed[key] : computed[key].get,
        set(){},
      })
    })

}
