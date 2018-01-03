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




