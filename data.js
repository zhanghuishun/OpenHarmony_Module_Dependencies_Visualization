// OpenHarmony 模块数据结构
const data = {
    subsystems: [
        {
            name: "内核子系统",
            modules: [
                { name: "内核驱动", id: "kernel_driver" },
                { name: "内存管理", id: "memory_mgmt" },
                { name: "进程管理", id: "process_mgmt" },
                { name: "文件系统", id: "filesystem" },
                { name: "网络协议栈", id: "network_stack" }
            ]
        },
        {
            name: "系统服务",
            modules: [
                { name: "窗口管理", id: "window_mgmt" },
                { name: "输入管理", id: "input_mgmt" },
                { name: "电源管理", id: "power_mgmt" },
                { name: "多媒体服务", id: "multimedia" },
                { name: "通信服务", id: "communication" },
                { name: "安全服务", id: "security" }
            ]
        },
        {
            name: "框架层",
            modules: [
                { name: "ArkUI", id: "arkui" },
                { name: "ArkTS运行时", id: "arkts" },
                { name: "分布式数据", id: "distributed_data" },
                { name: "RPC通信", id: "rpc" },
                { name: "DFX框架", id: "dfx" },
                { name: "包管理", id: "bundle_mgmt" }
            ]
        },
        {
            name: "应用层",
            modules: [
                { name: "桌面", id: "launcher" },
                { name: "设置", id: "settings" },
                { name: "相机", id: "camera_app" },
                { name: "图库", id: "gallery" },
                { name: "联系人", id: "contacts" }
            ]
        },
        {
            name: "硬件抽象层",
            modules: [
                { name: "显示驱动", id: "display_hal" },
                { name: "音频驱动", id: "audio_hal" },
                { name: "传感器驱动", id: "sensor_hal" },
                { name: "相机驱动", id: "camera_hal" },
                { name: "USB驱动", id: "usb_hal" }
            ]
        }
    ]
};

// 依赖关系定义
const dependencies = [
    { source: "arkui", target: "window_mgmt" },
    { source: "arkui", target: "input_mgmt" },
    { source: "arkts", target: "memory_mgmt" },
    { source: "arkts", target: "process_mgmt" },
    { source: "window_mgmt", target: "display_hal" },
    { source: "multimedia", target: "audio_hal" },
    { source: "multimedia", target: "display_hal" },
    { source: "camera_app", target: "camera_hal" },
    { source: "camera_app", target: "multimedia" },
    { source: "launcher", target: "arkui" },
    { source: "settings", target: "arkui" },
    { source: "gallery", target: "multimedia" },
    { source: "contacts", target: "distributed_data" },
    { source: "distributed_data", target: "communication" },
    { source: "rpc", target: "network_stack" },
    { source: "security", target: "kernel_driver" },
    { source: "power_mgmt", target: "kernel_driver" },
    { source: "input_mgmt", target: "sensor_hal" },
    { source: "bundle_mgmt", target: "filesystem" },
    { source: "dfx", target: "process_mgmt" }
];