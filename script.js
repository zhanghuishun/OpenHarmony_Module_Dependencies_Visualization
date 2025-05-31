// 设置画布 - 更新尺寸到1000x1000
const width = 1000;
const height = 1000;
const radius = Math.min(width, height) / 2 - 50;

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

// 创建提示框
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// 计算角度分配 - 优化后的逻辑
let totalModules = 0;
data.subsystems.forEach(subsystem => {
    totalModules += subsystem.modules.length;
});

// 减小子系统间的间距
const subsystemGap = (2 * Math.PI) / (data.subsystems.length * 40); // 从20改为40，间距更小
const totalGap = subsystemGap * data.subsystems.length;
const availableAngle = 2 * Math.PI - totalGap;

// 为每个模块分配位置，在子系统内均匀分布并添加模块间隙
const modulePositions = {};
const subsystemArcs = [];
let currentAngle = 0;

data.subsystems.forEach((subsystem, subsystemIndex) => {
    const moduleCount = subsystem.modules.length;
    // 子系统弧度按模块数量比例分配
    const subsystemAngle = (moduleCount / totalModules) * availableAngle;
    const startAngle = currentAngle;
    const endAngle = currentAngle + subsystemAngle;
    
    // 在子系统内为模块间添加小间隙
    const moduleGapRatio = 0.05; // 10%的空间用于间隙
    const totalModuleGaps = moduleCount > 1 ? moduleCount - 1 : 0;
    const moduleGapAngle = subsystemAngle * moduleGapRatio / totalModuleGaps;
    const availableModuleAngle = subsystemAngle * (1 - moduleGapRatio);
    const anglePerModule = totalModuleGaps > 0 ? availableModuleAngle / moduleCount : subsystemAngle;
    
    subsystem.modules.forEach((module, index) => {
        const moduleStartAngle = currentAngle + index * (anglePerModule + (index > 0 ? moduleGapAngle : 0));
        const moduleEndAngle = moduleStartAngle + anglePerModule;
        const angle = (moduleStartAngle + moduleEndAngle) / 2;
        
        modulePositions[module.id] = {
            angle: angle,
            subsystem: subsystem.name,
            name: module.name,
            moduleStartAngle: moduleStartAngle,
            moduleEndAngle: moduleEndAngle
        };
    });
    
    subsystemArcs.push({
        name: subsystem.name,
        startAngle: startAngle,
        endAngle: endAngle,
        modules: subsystem.modules
    });
    
    currentAngle = endAngle + subsystemGap;
});

// 绘制子系统弧形
const arcGenerator = d3.arc()
    .innerRadius(radius - 50)
    .outerRadius(radius - 15);

const subsystemArcsGroup = g.append("g").attr("class", "subsystem-arcs");

subsystemArcsGroup.selectAll(".subsystem-arc")
    .data(subsystemArcs)
    .enter()
    .append("path")
    .attr("class", "subsystem-arc")
    .attr("d", d => arcGenerator({
        startAngle: d.startAngle,
        endAngle: d.endAngle
    }))
    .attr("fill", "#ACC6FF")
    .attr("stroke", "none")
    .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "#8DB4FF");
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`子系统: ${d.name}<br>模块数量: ${d.modules.length}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        d3.select(this).attr("fill", "#ACC6FF");
        tooltip.transition().duration(500).style("opacity", 0);
    });

// 绘制模块弧形
const moduleArcGenerator = d3.arc()
    .innerRadius(radius - 85)
    .outerRadius(radius - 60);

const moduleArcsGroup = g.append("g").attr("class", "module-arcs");

Object.entries(modulePositions).forEach(([id, pos]) => {
    moduleArcsGroup.append("path")
        .attr("class", "module-arc")
        .attr("id", `module-${id}`)
        .attr("d", moduleArcGenerator({
            startAngle: pos.moduleStartAngle,
            endAngle: pos.moduleEndAngle
        }))
        .attr("fill", "#D7E2FB")
        .attr("stroke", "none")
        .on("mouseover", function(event) {
            d3.select(this).attr("fill", "#C1D4F7");
            showModuleLabel(id);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`模块: ${pos.name}<br>子系统: ${pos.subsystem}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            if (!d3.select(this).classed("selected")) {
                d3.select(this).attr("fill", "#D7E2FB");
                hideModuleLabel(id);
            }
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event) {
            event.stopPropagation();
            clearHighlight();
            selectModule(id);
        });
});

// 绘制标签
const labelsGroup = g.append("g").attr("class", "labels");

// 子系统标签
subsystemArcs.forEach(arc => {
    const midAngle = (arc.startAngle + arc.endAngle) / 2;
    const labelRadius = radius - 32;
    const x = Math.cos(midAngle - Math.PI / 2) * labelRadius;
    const y = Math.sin(midAngle - Math.PI / 2) * labelRadius;
    
    labelsGroup.append("text")
        .attr("class", "subsystem-label")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .text(arc.name);
});

// 模块标签 - 默认隐藏
Object.entries(modulePositions).forEach(([id, pos]) => {
    const labelRadius = radius - 72;
    const x = Math.cos(pos.angle - Math.PI / 2) * labelRadius;
    const y = Math.sin(pos.angle - Math.PI / 2) * labelRadius;
    
    labelsGroup.append("text")
        .attr("class", "module-label")
        .attr("id", `label-${id}`)
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .text(pos.name);
});

// 绘制依赖关系线
const line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(d => d.r)
    .angle(d => d.angle);

const dependencyGroup = g.append("g").attr("class", "dependencies");

dependencies.forEach((dep, index) => {
    const sourcePos = modulePositions[dep.source];
    const targetPos = modulePositions[dep.target];
    
    if (sourcePos && targetPos) {
        const points = [
            { angle: sourcePos.angle, r: radius - 72 },
            { angle: sourcePos.angle, r: radius / 3 },
            { angle: targetPos.angle, r: radius / 3 },
            { angle: targetPos.angle, r: radius - 72 }
        ];
        
        dependencyGroup.append("path")
            .attr("class", "dependency-line")
            .attr("id", `dep-${dep.source}-${dep.target}`)
            .attr("d", line(points))
            .attr("stroke", "#8DB4FF")
            .attr("stroke-width", 1.5)
            .attr("fill", "none")
            .style("opacity", 0.6);
    }
});

// 全局点击事件，取消选择
svg.on("click", function() {
    clearHighlight();
});

// 搜索功能
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    clearHighlight();
    
    if (searchTerm) {
        searchAndHighlight(searchTerm);
    }
});

function searchAndHighlight(searchTerm) {
    let found = false;
    let highlightedDeps = new Set();
    let highlightedModules = new Set();
    
    // 搜索模块
    Object.entries(modulePositions).forEach(([id, pos]) => {
        if (pos.name.toLowerCase().includes(searchTerm) || 
            pos.subsystem.toLowerCase().includes(searchTerm)) {
            highlightModule(id, highlightedDeps);
            highlightedModules.add(id);
            found = true;
        }
    });
    
    if (!found) {
        // 搜索子系统
        subsystemArcs.forEach(arc => {
            if (arc.name.toLowerCase().includes(searchTerm)) {
                arc.modules.forEach(module => {
                    highlightModule(module.id, highlightedDeps);
                    highlightedModules.add(module.id);
                });
            }
        });
    }
    
    // 显示高亮模块的标签
    highlightedModules.forEach(id => {
        showModuleLabel(id);
    });
    
    // 大幅降低其他依赖关系线的透明度
    d3.selectAll(".dependency-line").each(function() {
        const id = d3.select(this).attr("id");
        if (!highlightedDeps.has(id)) {
            d3.select(this).classed("dimmed", true);
        }
    });
}

function selectModule(moduleId) {
    let highlightedDeps = new Set();
    let relatedModules = new Set();
    highlightModule(moduleId, highlightedDeps, relatedModules);
    
    // 添加选中状态
    d3.select(`#module-${moduleId}`)
        .classed("selected", true);
    
    // 显示选中模块和相关模块的标签
    showModuleLabel(moduleId);
    relatedModules.forEach(id => {
        showModuleLabel(id);
    });
    
    // 大幅降低其他依赖关系线的透明度，使选中的更突出
    d3.selectAll(".dependency-line").each(function() {
        const id = d3.select(this).attr("id");
        if (!highlightedDeps.has(id)) {
            d3.select(this).classed("dimmed", true);
        }
    });
}

function highlightModule(moduleId, highlightedDeps, relatedModules = new Set()) {
    // 高亮模块
    d3.select(`#module-${moduleId}`)
        .attr("fill", "#8DB4FF");
    
    d3.select(`#label-${moduleId}`)
        .style("fill", "#2c3e50")
        .style("font-weight", "bold");
    
    // 高亮相关依赖关系
    dependencies.forEach(dep => {
        if (dep.source === moduleId || dep.target === moduleId) {
            const depId = `dep-${dep.source}-${dep.target}`;
            highlightedDeps.add(depId);
            d3.select(`#${depId}`)
                .classed("highlighted", true);
            
            // 高亮相关模块
            const relatedId = dep.source === moduleId ? dep.target : dep.source;
            relatedModules.add(relatedId);
            d3.select(`#module-${relatedId}`)
                .attr("fill", "#B8CDFA");
        }
    });
}

function showModuleLabel(moduleId) {
    d3.select(`#label-${moduleId}`)
        .classed("visible", true);
}

function hideModuleLabel(moduleId) {
    d3.select(`#label-${moduleId}`)
        .classed("visible", false);
}

function clearHighlight() {
    d3.selectAll(".module-arc")
        .attr("fill", "#D7E2FB")
        .classed("selected", false);
    
    d3.selectAll(".module-label")
        .style("fill", "#5a6c7d")
        .style("font-weight", "500")
        .classed("visible", false);
    
    d3.selectAll(".dependency-line")
        .classed("highlighted", false)
        .classed("dimmed", false);
}

function clearSearch() {
    searchInput.value = '';
    clearHighlight();
}

function toggleHelp() {
    const helpPanel = document.getElementById('helpPanel');
    helpPanel.classList.toggle('show');
}

// 点击其他地方关闭帮助面板
document.addEventListener('click', function(event) {
    const helpBtn = event.target.closest('.help-btn');
    const helpPanel = document.getElementById('helpPanel');
    
    if (!helpBtn && !helpPanel.contains(event.target)) {
        helpPanel.classList.remove('show');
    }
});

// 响应式调整
function resize() {
    const container = document.getElementById('visualization');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.min(containerWidth, containerHeight, 1000);
    
    svg.attr("width", size).attr("height", size);
    g.attr("transform", `translate(${size / 2}, ${size / 2})`);
}

window.addEventListener('resize', resize);
resize();