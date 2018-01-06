# MVVM  

双向数据绑定  model view viewModel  

1.angular 脏值检查 $watch()  $apply()/ $digest(),

2.vue 数据劫持 + 发布订阅模式 (不兼容低版本)


vue 不兼容低版本的原因是因为 低版本浏览器不兼容Object.defineProperty这个属性 我们首先了解一下这个属性  正常中我们定义一个对象

```
   var obj = {}
   obj.公众号 =  '前端架构之路',
   //console.log(obj) {"公众号","前端架构之路"}
   delect obj.公众号
   //console.log(obj) {}
```
然后如果我们用到了Object.defineProperty 这个属性你就会发现不同了,需要配置一下参数才能达成以上的需求
```
  var  obj  = {};
    Object.defineProperty(obj, '公众号',{
      configurable:true,  //属性值可以被删除
      writable:true,  //对属性可进行编写
      enumerable: true, //可枚举
      value:'前端架构之路'
    })

```
首先我们要了解这些属性 然后我们在进行值修改,但有的时候我们会用到 get set方法 跟vue当的一样

```
 var  obj  = {};
    Object.defineProperty(obj, '公众号',{
      configurable:true,  //属性值可以被删除
      enumerable: true, //可枚举
      get() {
        //获取obj.公众号值得时候 会调用get方法
        return '前端架构之路'
      }
      set() {
        //给obj 属性赋值
      }
    })
console.log(obj.公众号)  //前端架构之路

```

我们通常写vue的时候 都会这样

```
<body>
  <div id="app">
      {{gongzhonghao}}
  </div>
</body>

<script>
    let mvvm = new Mvvm({
        el: '#app',
        data:{ gongzhonghao:'前端架构之路'}
    })

</script>

```


那么如何去实现呢？ 我们用这个Object.defineProperty 这个属性来实现数据劫持(observer)


```

//数据劫持 观察对象给递归给每一个对象增加Object.definePropery 通过set方法触发 就能监听到了数据的变化


function observe (data) {
    return new Observe(data)
}

function Observe (data) {
    if(!data || typeof data !== 'object')  return
    //把data属性 通过Object.definePropert  来定义属性
    for (let key in data) {   
        let value = data[key]  
        //递归方式绑定所有属性    数据是 {a:{b:1}}
        observe(value)
        Object.defineProperty(data, key, {
            enumerable:true,
            get() {
                return value
            },
            set(newValue) {
                //如果值没有发生改变的话  
                if(newValue  == value) return
                //重新赋值
                value = newValue
                observe(value)
            },
        })
    }
}




```



### vue中的数据代理   

在项目中 我们会遇到一些比较复杂的数据结构 例如 data:{ gongzhonghao:'前端架构之路', msg:{vx:214464812,creator: 'zhangzhen' }}  如果你用的我上面写的observe 方法的话 就会发现 我要获取creator 字段的话 需要通过mvvm._data.msg.creator   ..... 如果复杂的数据结构很多的话 就会很乱 需要通过mvvm.msg方式来获取数据(去掉_data)
那么就要用到数据代理的方式来处理以上问题 。


```
   //数据代理方式
   for(let key in data ) {
     Object.defineProperty(this, key ,{
        enumerable:true,
        get() {
            return this._data[key];
        },
        set(newValue){
            this._data[key] = newValue
        }
     })
   }

```
vue特点 不能新增不存在的属性   不存在的属性没有get set 。
深度响应 因为每次赋予一个新对象 会增加数据截止


### 模板编译Compile

模板编译是把我们通过{{}}中的属性值 用我们的data去替换  首先我们通过#el 来确定编译的范围，创建createDocumentFragment 在内存中去更换我们的模板 减少DOM操作，通过nodeType 来判断当前的节点，利用
正则来匹配{{}} 通过递归的方式来更换每一个数据


```

function Compile(el,vm) {
  vm.$el = document.querySelector(el);
  var Fragment = document.createDocumentFragment();
  //把模板放入内存当中
  while (child = vm.$el.firstChild) {
    Fragment.appendChild(child)
  }
  replace(Fragment,vm)
  vm.$el.appendChild(Fragment)
}

function replace (Fragment,vm){
    //类数组转化成数组
  Array.from(Fragment.childNodes).forEach(function(node){
    var text = node.textContent ;
    var reg = /\{\{(.*)\}\}/;
    if(node.nodeType == '3' && reg.test(text)) {
        //console.log(RegExp.$1)
        let ary = RegExp.$1.split('.')
        //console.log(ary)  [msg, vx]   
        let val = vm  
        ary.forEach(function(key){  //取this.msg  /this.gongzhonghao
            val = val[key]
        });
        node.textContent = text.replace(reg,val)
    }
    if(node.childNodes){
        replace(node,vm)
    }
  })
}

```


### 发布订阅模式(重点)

以上的操作已经完成了一个简单的数据与模板的绑定,那么大家关心的数据驱动该如何实现？
当一个值发生变化的时候 视图也发生变化 这就需要我们去订阅一些事件
ep.addSub(Dep.target) 是增加订阅 , dep.notify函数 是发布事件
当值发生改变的时候我们去发布这个事件(调用dep.notify()）
```
observe(value)
Object.defineProperty(data, key, {
    enumerable:true,
    get() {
        console.log(Dep.target)  
        Dep.target && dep.addSub(Dep.target)  //[增加watcher]
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

```

#### 1.如何去订阅一些事件  

说到订阅 那么问题来了，谁是订阅者？怎么往订阅器添加订阅者？ 在dep-subs.js中我指定了 Wathcher是订阅者
首先要增加Wathcher是订阅者 把订阅者放到订阅器(subs)中  当值发生变化的时候 订阅器就会调用update 方法去发布一些事件。


##### (1)增加订阅  


```
  //绑定的方法都有一个update属性
  function Dep (){
    this.subs = []  //订阅器
  }
  //增加订阅
  Dep.prototype.addSub = function(watcher) {
     this.subs.push(watcher)
  }

```
##### (2)发布订阅

```
//通知
Dep.prototype.notify = function() {
   this.subs.forEach(watcher => watcher.update())
}


```
##### (3) 观察者

```
function Watcher(vm,exp,fn){
   this.vm = vm
   this.exp = exp
   this.fn = fn         //添加到订阅中
   Dep.target = this
   var val  = vm
   var arr = exp.split('.');
   arr.forEach(function(key){
       val = val[key]
   })     //在这里调用objectDefineProperty中get方法
   Dep.target = null
}
Watcher.prototype.update = function() {
  //获取新值
  var val  = this.vm
  var arr = this.exp.split('.');
  arr.forEach(function(key){
      val = val[key]
  })
  this.fn(val);
}
```
#### (4) 发布之后 修改模板
当我们调用dep.notify()的时候 其实就是调用update方法 在compile.js中模板重新赋值

```
  //发布订阅模式开启
  new Watcher(vm, RegExp.$1, function(newValue){
    node.textContent = text.replace(reg,newValue)
  })

```
