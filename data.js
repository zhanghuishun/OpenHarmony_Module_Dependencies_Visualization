// OpenHarmony 模块数据结构 (小型系统)
const data = {
    subsystems: [
        {
            name: "内核子系统",
            modules: [
                { name: "LiteOS内核", id: "liteos_kernel" },
                { name: "内存管理", id: "memory_mgmt" },
                { name: "进程管理", id: "process_mgmt" },
                { name: "文件系统", id: "filesystem" },
                { name: "网络协议栈", id: "network_stack" }
            ]
        },
        {
            name: "驱动子系统",
            modules: [
                { name: "设备驱动框架", id: "driver_framework" },
                { name: "传感器驱动", id: "sensor_driver" },
                { name: "显示驱动", id: "display_driver" },
                { name: "输入设备驱动", id: "input_driver" }
            ]
        },
        {
            name: "泛Sensor服务",
            modules: [
                { name: "传感器管理", id: "sensor_mgmt" },
                { name: "马达控制", id: "vibrator" },
                { name: "LED控制", id: "led" }
            ]
        },
        {
            name: "图形子系统",
            modules: [
                { name: "UI组件", id: "ui_components" },
                { name: "布局管理", id: "layout_mgmt" },
                { name: "动画引擎", id: "animation" },
                { name: "渲染引擎", id: "rendering" }
            ]
        },
        {
            name: "分布式软总线",
            modules: [
                { name: "设备发现", id: "device_discovery" },
                { name: "设备连接", id: "device_connection" },
                { name: "数据传输", id: "data_transfer" }
            ]
        },
        {
            name: "JS UI框架",
            modules: [
                { name: "JS组件库", id: "js_components" },
                { name: "JS运行时", id: "js_runtime" },
                { name: "UI渲染", id: "ui_rendering" }
            ]
        },
        {
            name: "媒体子系统",
            modules: [
                { name: "音频服务", id: "audio_service" },
                { name: "视频服务", id: "video_service" },
                { name: "图像处理", id: "image_processing" }
            ]
        },
        {
            name: "安全子系统",
            modules: [
                { name: "应用权限管理", id: "permission_mgmt" },
                { name: "设备认证", id: "device_auth" },
                { name: "密钥管理", id: "key_mgmt" }
            ]
        }
    ]
};

// 依赖关系定义 (按密集程度排列)
const dependencies = [
    // 图形子系统相关依赖
    { source: "ui_components", target: "layout_mgmt" },
    { source: "ui_components", target: "animation" },
    { source: "rendering", target: "display_driver" },
    { source: "js_components", target: "ui_components" },
    { source: "js_runtime", target: "memory_mgmt" },
    { source: "ui_rendering", target: "rendering" },
    
    // 驱动与传感器相关依赖
    { source: "sensor_mgmt", target: "sensor_driver" },
    { source: "vibrator", target: "driver_framework" },
    { source: "led", target: "driver_framework" },
    { source: "input_driver", target: "driver_framework" },
    
    // 分布式软总线相关依赖
    { source: "device_discovery", target: "network_stack" },
    { source: "device_connection", target: "network_stack" },
    { source: "data_transfer", target: "filesystem" },
    
    // 媒体子系统相关依赖
    { source: "audio_service", target: "driver_framework" },
    { source: "video_service", target: "display_driver" },
    { source: "image_processing", target: "memory_mgmt" },
    
    // 安全子系统相关依赖
    { source: "permission_mgmt", target: "process_mgmt" },
    { source: "device_auth", target: "network_stack" },
    { source: "key_mgmt", target: "liteos_kernel" },
    
    // 跨子系统依赖
    { source: "js_runtime", target: "liteos_kernel" },
    { source: "animation", target: "process_mgmt" },
    { source: "layout_mgmt", target: "memory_mgmt" }
];