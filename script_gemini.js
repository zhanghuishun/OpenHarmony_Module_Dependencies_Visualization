/*
 * "Stardust" Theme Script for Code Dependency Visualization
 * Version: 1.0
 * Updates: Aligned with the Stardust CSS theme by removing hardcoded styles
 * and using CSS classes for styling.
*/

// --- 1. Color Palette (Aligned with Stardust CSS) ---
// Note: Most styling is now handled by CSS classes.
// This object defines colors for dynamic interactions.
const stardustColors = {
    subsystemFill: '#F1F3F5',      // A very light gray for the base
    subsystemHover: '#E9ECEF',     // A slightly darker gray for hover
    moduleFill: '#FFFFFF',         // White for modules to stand out on the gray base
    moduleHover: '#F8F9FA',        // A very light off-white for hover
    moduleSelected: '#007BFF',     // Quantum Blue (from CSS) for selected module's label
    moduleRelated: '#E7F1FF',      // A light blue background for related modules
    labelHighlight: '#007BFF'      // Quantum Blue for highlighted text
};


// --- 2. D3 Setup ---
const width = 1040; // Match the container size from CSS
const height = 1040;
const radius = Math.min(width, height) / 2 - 50;

const svg = d3.select("#visualization")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`) // Use viewBox for better responsiveness
    .attr("preserveAspectRatio", "xMidYMid meet");

const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// --- 3. Data Processing & Angle Calculation ---
let totalModules = 0;
data.subsystems.forEach(subsystem => {
    totalModules += subsystem.modules.length;
});

const subsystemGap = (2 * Math.PI) / (data.subsystems.length * 40);
const totalGap = subsystemGap * data.subsystems.length;
const availableAngle = 2 * Math.PI - totalGap;

const modulePositions = {};
const subsystemArcs = [];
let currentAngle = 0;

data.subsystems.forEach((subsystem, subsystemIndex) => {
    const moduleCount = subsystem.modules.length;
    const subsystemAngle = (moduleCount / totalModules) * availableAngle;
    const startAngle = currentAngle;
    const endAngle = currentAngle + subsystemAngle;

    const moduleGapRatio = 0.05;
    const totalModuleGaps = moduleCount > 1 ? moduleCount - 1 : 0;
    const moduleGapAngle = totalModuleGaps > 0 ? subsystemAngle * moduleGapRatio / totalModuleGaps : 0;
    const availableModuleAngle = subsystemAngle * (1 - moduleGapRatio);
    const anglePerModule = moduleCount > 0 ? availableModuleAngle / moduleCount : subsystemAngle;

    subsystem.modules.forEach((module, index) => {
        const moduleStartAngle = currentAngle + index * (anglePerModule + moduleGapAngle);
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

// --- 4. Drawing Visualization Elements ---

// Subsystem Arcs
const arcGenerator = d3.arc()
    .innerRadius(radius - 50)
    .outerRadius(radius - 15);

const subsystemArcsGroup = g.append("g").attr("class", "subsystem-arcs");

subsystemArcsGroup.selectAll(".subsystem-arc")
    .data(subsystemArcs)
    .enter()
    .append("path")
    .attr("class", "subsystem-arc")
    .attr("d", d => arcGenerator({ startAngle: d.startAngle, endAngle: d.endAngle }))
    .attr("fill", stardustColors.subsystemFill) // Apply base color
    .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", stardustColors.subsystemHover); // Hover color
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<b>子系统:</b> ${d.name}<br><b>模块数量:</b> ${d.modules.length}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        d3.select(this).attr("fill", stardustColors.subsystemFill); // Revert to base color
        tooltip.transition().duration(500).style("opacity", 0);
    });

// Module Arcs
const moduleArcGenerator = d3.arc()
    .innerRadius(radius - 85)
    .outerRadius(radius - 60);

const moduleArcsGroup = g.append("g").attr("class", "module-arcs");

Object.entries(modulePositions).forEach(([id, pos]) => {
    moduleArcsGroup.append("path")
        .attr("class", "module-arc")
        .attr("id", `module-${id}`)
        .attr("d", moduleArcGenerator({ startAngle: pos.moduleStartAngle, endAngle: pos.moduleEndAngle }))
        .attr("fill", stardustColors.moduleFill) // Apply base color
        .on("mouseover", function(event) {
            if (!d3.select(this).classed("selected")) {
                d3.select(this).attr("fill", stardustColors.moduleHover);
            }
            showModuleLabel(id);
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<b>模块:</b> ${pos.name}<br><b>子系统:</b> ${pos.subsystem}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            if (!d3.select(this).classed("selected")) {
                d3.select(this).attr("fill", stardustColors.moduleFill);
                hideModuleLabel(id);
            }
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event) {
            event.stopPropagation();
            const isSelected = d3.select(this).classed("selected");
            clearHighlight();
            if (!isSelected) {
                selectModule(id);
            }
        });
});

// Labels
const labelsGroup = g.append("g").attr("class", "labels");

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

// Dependency Lines
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
            { angle: sourcePos.angle, r: radius - 72 }, // Adjusted radius to touch the module labels area
            { angle: sourcePos.angle, r: radius / 3 },
            { angle: targetPos.angle, r: radius / 3 },
            { angle: targetPos.angle, r: radius - 72 }
        ];

        dependencyGroup.append("path")
            .attr("class", "dependency-line") // Rely on CSS for styling
            .attr("id", `dep-${dep.source}-${dep.target}`)
            .attr("d", line(points));
            // Removed hardcoded stroke, stroke-width, and fill attributes
    }
});


// --- 5. Interactivity Functions ---

svg.on("click", function() {
    clearHighlight();
});

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function() {
    clearHighlight();
    const searchTerm = this.value.toLowerCase().trim();
    if (searchTerm) {
        searchAndHighlight(searchTerm);
    }
});

function searchAndHighlight(searchTerm) {
    let highlightedDeps = new Set();
    let highlightedModules = new Set();

    Object.entries(modulePositions).forEach(([id, pos]) => {
        if (pos.name.toLowerCase().includes(searchTerm) || pos.subsystem.toLowerCase().includes(searchTerm)) {
            highlightModule(id, highlightedDeps, highlightedModules);
        }
    });

    d3.selectAll(".dependency-line").classed("dimmed", true);
    highlightedDeps.forEach(depId => {
        d3.select(`#${depId}`).classed("dimmed", false).classed("highlighted", true);
    });
    highlightedModules.forEach(id => {
        showModuleLabel(id);
    });
}

function selectModule(moduleId) {
    let highlightedDeps = new Set();
    let relatedModules = new Set([moduleId]); // Start with the selected module
    highlightModule(moduleId, highlightedDeps, relatedModules);

    d3.select(`#module-${moduleId}`)
        .classed("selected", true)
        .attr("fill", stardustColors.moduleHover); // Keep it slightly highlighted

    d3.selectAll(".dependency-line").classed("dimmed", true);
    highlightedDeps.forEach(depId => {
        d3.select(`#${depId}`).classed("dimmed", false).classed("highlighted", true);
    });

    relatedModules.forEach(id => {
        showModuleLabel(id);
        if (id !== moduleId) {
             d3.select(`#module-${id}`).attr("fill", stardustColors.moduleRelated);
        }
    });
}


function highlightModule(moduleId, highlightedDeps, relatedModules) {
    d3.select(`#label-${moduleId}`)
        .style("fill", stardustColors.labelHighlight)
        .style("font-weight", "600");

    dependencies.forEach(dep => {
        if (dep.source === moduleId || dep.target === moduleId) {
            highlightedDeps.add(`dep-${dep.source}-${dep.target}`);
            const relatedId = dep.source === moduleId ? dep.target : dep.source;
            relatedModules.add(relatedId);
        }
    });
}

function showModuleLabel(moduleId) {
    d3.select(`#label-${moduleId}`).classed("visible", true);
}

function hideModuleLabel(moduleId) {
    if (!d3.select(`#module-${moduleId}`).classed("selected")) {
        d3.select(`#label-${moduleId}`).classed("visible", false);
    }
}

function clearHighlight() {
    d3.selectAll(".module-arc")
        .attr("fill", stardustColors.moduleFill)
        .classed("selected", false);

    d3.selectAll(".module-label")
        .style("fill", null) // Let CSS handle the color
        .style("font-weight", null) // Let CSS handle the weight
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
    document.getElementById('helpPanel').classList.toggle('show');
}

document.addEventListener('click', function(event) {
    const helpBtn = event.target.closest('.help-btn');
    const helpPanel = document.getElementById('helpPanel');
    // Check if helpPanel exists before accessing contains property
    if (helpPanel && !helpPanel.contains(event.target) && !helpBtn) {
        helpPanel.classList.remove('show');
    }
});
