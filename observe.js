
//数据劫持 观察对象给递归给每一个对象增加Object.definePropert 通过set方法触发 就能监听到了数据的变化

function observe (data) {
    return new Observe(data)
}

function Observe (data) {
    if(!data || typeof data !== 'object')  return
    let dep = new Dep()
    //把data属性 通过Object.definePropert  来定义属性
    for (let key in data) {
        let value = data[key]
        //递归方式绑定所有属性    数据是 {a:{b:1}}
        observe(value)
        Object.defineProperty(data, key, {
            enumerable:true,
            get() {
                console.log(Dep.target)
                Dep.target && dep.addSub(Dep.target)  //[watcher]
                return value
            },
            set(newValue) {
                //如果值没有发生改变的话
                if(newValue  == value) return
                //重新赋值
                value = newValue
                observe(value)
                dep.notify()  //让所有的watcher的update 执行
            },
        })
    }
}
