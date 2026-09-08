'use strict';

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

const charts = new Map();

const state = {
    period: '30',
    newPatientsMode: 'bar',
    evolutionMetric: 'all',
    rankMode: 'geral',
    filters: {},
    data: null
};

const COLORS = {
    brand: '#4f46e5',
    cyan: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0284c7',
    purple: '#8b5cf6',
    rose: '#f43f5e',
    gray: '#94a3b8'
};

const MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr',
    'Mai', 'Jun', 'Jul', 'Ago',
    'Set', 'Out', 'Nov', 'Dez'
];

const MONTHS_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const numberFormatter = new Intl.NumberFormat('pt-BR');

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
});

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
});

function formatNumber(value) {
    return numberFormatter.format(
        Math.round(Number(value) || 0)
    );
}

function formatCurrency(value) {
    return currencyFormatter.format(
        Number(value) || 0
    );
}

function formatDecimal(value) {
    return decimalFormatter.format(
        Number(value) || 0
    );
}

function formatPercent(value) {
    return `${formatDecimal(value)}%`;
}

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function isDark() {
    return document.documentElement.classList.contains('dark');
}

function themeColors() {
    return {
        text: isDark() ? '#cbd5e1' : '#475569',
        muted: isDark() ? '#94a3b8' : '#64748b',
        grid: isDark()
            ? 'rgba(148,163,184,.16)'
            : 'rgba(15,23,42,.07)',
        surface: isDark() ? '#111832' : '#ffffff'
    };
}

function showToast(message, type = 'info') {
    const area = $('#toastBox');
    if (!area) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');

    area.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
    }, 2800);

    setTimeout(() => toast.remove(), 3200);
}

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function destroyChart(key) {
    const chart = charts.get(key);

    if (chart) {
        chart.destroy();
        charts.delete(key);
    }
}

function registerChart(key, chart) {
    destroyChart(key);
    charts.set(key, chart);
}

function isPlainObject(value) {
    return Boolean(value) &&
        typeof value === 'object' &&
        !Array.isArray(value);
}

function mergeDeep(base, override) {
    const result = { ...base };

    Object.entries(override).forEach(([key, value]) => {
        result[key] = isPlainObject(value) && isPlainObject(base[key])
            ? mergeDeep(base[key], value)
            : value;
    });

    return result;
}

function chartOptions(options = {}) {
    const theme = themeColors();

    const defaults = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 600,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: {
                labels: {
                    color: theme.text,
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 12
                }
            },
            tooltip: {
                backgroundColor: theme.surface,
                titleColor: theme.text,
                bodyColor: theme.text,
                borderColor: theme.grid,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 9,
                usePointStyle: true
            }
        },
        scales: {
            x: {
                ticks: { color: theme.muted },
                grid: { color: theme.grid }
            },
            y: {
                ticks: { color: theme.muted },
                grid: { color: theme.grid },
                beginAtZero: true
            }
        }
    };

    return mergeDeep(defaults, options);
}

function makeData() {
    return {
        totalPatients: 12847,

        acquisition: [
            342, 368, 401, 389,
            425, 448, 462, 471,
            489, 512, 498, 487
        ],

        target: [
            350, 370, 390, 410,
            430, 450, 470, 490,
            510, 530, 550, 570
        ],

        gender: [
            {
                name: 'Feminino',
                value: 7048,
                color: COLORS.rose
            },
            {
                name: 'Masculino',
                value: 5011,
                color: COLORS.brand
            },
            {
                name: 'Outro / Não informado',
                value: 788,
                color: COLORS.gray
            }
        ],

        insurance: [
            ['Particular', 2840, 418, 2422, 36, 3120, 9.4, 'up'],
            ['Unimed', 3210, 384, 2826, 39, 2480, 6.2, 'up'],
            ['Bradesco Saúde', 1980, 264, 1716, 41, 2780, 4.8, 'up'],
            ['SulAmérica', 1420, 198, 1222, 38, 2540, 11.2, 'up'],
            ['Amil', 1180, 146, 1034, 40, 2220, -2.1, 'down'],
            ['NotreDame', 842, 104, 738, 37, 2140, 8.3, 'up'],
            ['Hapvida', 684, 82, 602, 42, 1840, 5.7, 'up'],
            ['Outros', 691, 76, 615, 39, 2080, 3.2, 'up']
        ].map(item => ({
            name: item[0],
            patients: item[1],
            newPatients: item[2],
            returns: item[3],
            age: item[4],
            ltv: item[5],
            variation: item[6],
            trend: item[7]
        })),

        ageGroups: [
            ['0–12', 284, 312],
            ['13–17', 198, 212],
            ['18–29', 1420, 1180],
            ['30–44', 2680, 2120],
            ['45–59', 1842, 1418],
            ['60+', 1064, 317]
        ].map(item => ({
            label: item[0],
            female: item[1],
            male: item[2]
        })),

        cities: [
            ['São Paulo · SP', 42],
            ['Guarulhos · SP', 14],
            ['Osasco · SP', 11],
            ['Santo André · SP', 9],
            ['Barueri · SP', 8],
            ['Outros', 16]
        ].map(item => ({
            name: item[0],
            value: item[1]
        })),

        origins: [
            'Indicação',
            'Google',
            'Instagram',
            'Convênio',
            'Site',
            'Retorno'
        ],

        evolutionReal: [
            9820, 10170, 10530, 10920,
            11340, 11780, 12220, 12680,
            13140, 13620, 14080, 14540
        ],

        evolutionTarget: [
            9800, 10200, 10600, 11000,
            11400, 11800, 12200, 12600,
            13000, 13400, 13800, 14200
        ],

        evolutionPrevious: [
            9140, 9480, 9810, 10160,
            10520, 10860, 11200, 11540,
            11880, 12210, 12540, 12890
        ],

        patients: [
            ['Maria Silva Santos', 'Particular', 42, 'há 3 dias', 18420, 9.8],
            ['João Pedro Almeida', 'Unimed', 38, 'há 1 semana', 16280, 9.6],
            ['Ana Beatriz Costa', 'Bradesco Saúde', 36, 'há 2 dias', 15640, 9.7],
            ['Carlos Eduardo Lima', 'Particular', 34, 'há 5 dias', 14820, 9.4],
            ['Fernanda Ribeiro', 'SulAmérica', 32, 'há 12 dias', 13980, 9.5],
            ['Roberto Mendes', 'Unimed', 30, 'há 1 dia', 13420, 9.3],
            ['Patrícia Oliveira', 'Particular', 29, 'há 8 dias', 12960, 9.6],
            ['Lucas Henrique Souza', 'Amil', 27, 'há 4 dias', 11840, 9.2],
            ['Camila Andrade', 'Particular', 26, 'há 2 semanas', 11420, 9.5],
            ['Bruno Castro Vieira', 'NotreDame', 25, 'há 6 dias', 10840, 9.1],
            ['Juliana Pereira', 'Unimed', 24, 'há 9 dias', 10420, 9.4],
            ['Marcelo Torres', 'Bradesco Saúde', 23, 'há 3 semanas', 9980, 9.0]
        ].map(item => ({
            name: item[0],
            insurance: item[1],
            consultations: item[2],
            lastVisit: item[3],
            ltv: item[4],
            nps: item[5]
        }))
    };
}

function renderNewPatients() {
    const canvas = $('#chartNovosPacientes');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 300);

    gradient.addColorStop(0, 'rgba(79,70,229,.9)');
    gradient.addColorStop(1, 'rgba(6,182,212,.75)');

    const area = context.createLinearGradient(0, 0, 0, 300);
    area.addColorStop(0, 'rgba(79,70,229,.28)');
    area.addColorStop(1, 'rgba(79,70,229,0)');

    const chart = new Chart(canvas, {
        type: state.newPatientsMode === 'line'
            ? 'line'
            : 'bar',

        data: {
            labels: MONTHS,
            datasets: [
                {
                    label: 'Novos pacientes',
                    data: state.data.acquisition,
                    backgroundColor: state.newPatientsMode === 'line'
                        ? area
                        : gradient,
                    borderColor: COLORS.brand,
                    borderWidth: state.newPatientsMode === 'line'
                        ? 3
                        : 0,
                    borderRadius: 7,
                    fill: state.newPatientsMode === 'line',
                    tension: .38,
                    pointRadius: state.newPatientsMode === 'line'
                        ? 4
                        : 0,
                    maxBarThickness: 32
                },
                {
                    type: 'line',
                    label: 'Meta',
                    data: state.data.target,
                    borderColor: COLORS.warning,
                    borderDash: [6, 5],
                    borderWidth: 2,
                    pointRadius: 2,
                    fill: false,
                    tension: .35
                }
            ]
        },

        options: chartOptions({
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        })
    });

    registerChart('newPatients', chart);
}

function renderGender() {
    const canvas = $('#chartSexoPacientes');
    if (!canvas) return;

    const total = state.data.gender.reduce(
        (sum, item) => sum + item.value,
        0
    );

    $('#doughnutTotal').textContent = formatNumber(total);

    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: state.data.gender.map(item => item.name),
            datasets: [{
                data: state.data.gender.map(item => item.value),
                backgroundColor: state.data.gender.map(item => item.color),
                borderWidth: 0,
                spacing: 3,
                hoverOffset: 8
            }]
        },
        options: chartOptions({
            cutout: '72%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatNumber(context.raw)}`;
                        }
                    }
                }
            }
        })
    });

    registerChart('gender', chart);

    $('#legendSexo').innerHTML =
        state.data.gender.map(item => {
            const percentage = item.value / total * 100;

            return `
                <span class="rounded-full px-2 py-1 text-[10px]"
                    style="background:var(--panel-soft);color:var(--text-soft)">
                    <span class="mr-1 inline-block h-2 w-2 rounded-full"
                        style="background:${item.color}"></span>
                    ${escapeHTML(item.name)}
                    <strong class="ml-1">${formatPercent(percentage)}</strong>
                </span>
            `;
        }).join('');
}

function renderInsurance() {
    const canvas = $('#chartConveniosPacientes');
    if (!canvas) return;

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: state.data.insurance.map(item => item.name),
            datasets: [{
                label: 'Pacientes',
                data: state.data.insurance.map(item => item.patients),
                backgroundColor: [
                    COLORS.brand,
                    COLORS.cyan,
                    COLORS.purple,
                    COLORS.rose,
                    COLORS.warning,
                    COLORS.success,
                    COLORS.info,
                    COLORS.gray
                ],
                borderRadius: 6,
                borderWidth: 0,
                maxBarThickness: 26
            }]
        },
        options: chartOptions({
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            }
        })
    });

    registerChart('insurance', chart);
}

function renderAge() {
    const canvas = $('#chartFaixaEtaria');
    if (!canvas) return;

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: state.data.ageGroups.map(item => item.label),
            datasets: [
                {
                    label: 'Feminino',
                    data: state.data.ageGroups.map(item => item.female),
                    backgroundColor: `${COLORS.rose}cc`,
                    borderRadius: 6,
                    maxBarThickness: 24
                },
                {
                    label: 'Masculino',
                    data: state.data.ageGroups.map(item => item.male),
                    backgroundColor: `${COLORS.brand}cc`,
                    borderRadius: 6,
                    maxBarThickness: 24
                }
            ]
        },
        options: chartOptions({
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        })
    });

    registerChart('age', chart);
}

function renderEvolution() {
    const canvas = $('#chartEvolucaoPacientes');
    if (!canvas) return;

    const datasets = [];

    if (state.evolutionMetric === 'all' ||
        state.evolutionMetric === 'real') {
        datasets.push({
            label: 'Realizado',
            data: state.data.evolutionReal,
            borderColor: COLORS.brand,
            backgroundColor: 'rgba(79,70,229,.14)',
            borderWidth: 3,
            tension: .38,
            fill: true,
            pointRadius: 3
        });
    }

    if (state.evolutionMetric === 'all' ||
        state.evolutionMetric === 'target') {
        datasets.push({
            label: 'Meta',
            data: state.data.evolutionTarget,
            borderColor: COLORS.success,
            borderDash: [6, 5],
            borderWidth: 2,
            tension: .35,
            fill: false,
            pointRadius: 2
        });
    }

    if (state.evolutionMetric === 'all' ||
        state.evolutionMetric === 'prev') {
        datasets.push({
            label: 'Ano anterior',
            data: state.data.evolutionPrevious,
            borderColor: COLORS.gray,
            borderDash: [2, 4],
            borderWidth: 2,
            tension: .35,
            fill: false,
            pointRadius: 2
        });
    }

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: MONTHS,
            datasets
        },
        options: chartOptions({
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        })
    });

    registerChart('evolution', chart);
}

function renderSparklines() {
    $$('.spark').forEach((canvas, index) => {
        const color = canvas.dataset.color || COLORS.brand;
        const values = Array.from(
            { length: 12 },
            (_, position) =>
                28 + position * 2 + ((position * 11 + index * 5) % 14)
        );

        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, 40);

        gradient.addColorStop(0, `${color}55`);
        gradient.addColorStop(1, `${color}00`);

        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: values.map(() => ''),
                datasets: [{
                    data: values,
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    tension: .4,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });

        registerChart(`spark-${index}`, chart);
    });
}

function renderCities() {
    const container = $('#topCities');
    if (!container) return;

    const max = Math.max(
        ...state.data.cities.map(city => city.value)
    );

    container.innerHTML = state.data.cities.map(city => {
        const width = city.value / max * 100;

        return `
            <div>
                <div class="mb-1 flex justify-between text-xs">
                    <span style="color:var(--text-soft)">
                        ${escapeHTML(city.name)}
                    </span>
                    <strong class="font-mono">
                        ${city.value}%
                    </strong>
                </div>

                <div class="h-2 overflow-hidden rounded-full"
                    style="background:var(--line-soft)">
                    <div class="h-full rounded-full"
                        style="width:${width}%;background:var(--gradient)">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderHeatmap() {
    const container = $('#heatmap');
    if (!container) return;

    const base = [120, 86, 142, 98, 64, 108];

    const rows = state.data.origins.map((origin, originIndex) => ({
        origin,
        values: MONTHS.map((_, monthIndex) => {
            const season = .78 +
                ((monthIndex * 9 + originIndex * 13) % 38) / 100;

            const instagramBoost =
                origin === 'Instagram'
                    ? monthIndex * 6
                    : 0;

            return Math.round(
                base[originIndex] * season +
                instagramBoost
            );
        })
    }));

    const allValues = rows.flatMap(row => row.values);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    const intensity = value => {
        if (max === min) return .5;
        return .18 + ((value - min) / (max - min)) * .82;
    };

    let html = `
        <div class="heatmap-row heatmap-header">
            <div class="heatmap-label">Origem</div>
            ${MONTHS.map(month => `<div>${month}</div>`).join('')}
        </div>
    `;

    rows.forEach(row => {
        html += `
            <div class="heatmap-row">
                <div class="heatmap-label">
                    ${escapeHTML(row.origin)}
                </div>

                ${row.values.map((value, index) => `
                    <div
                        class="heatmap-cell"
                        style="--intensity:${intensity(value)}"
                        title="${escapeHTML(row.origin)} — ${MONTHS_FULL[index]}: ${formatNumber(value)} pacientes">
                        ${formatNumber(value)}
                    </div>
                `).join('')}
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderRank() {
    const tbody = $('#rankTable tbody');
    if (!tbody) return;

    let patients = [...state.data.patients];

    if (state.rankMode === 'frequency') {
        patients.sort((a, b) =>
            b.consultations - a.consultations
        );
    } else {
        patients.sort((a, b) => b.ltv - a.ltv);
    }

    const maxVisits = Math.max(
        ...patients.map(patient => patient.consultations)
    );

    const maxLtv = Math.max(
        ...patients.map(patient => patient.ltv)
    );

    tbody.innerHTML = patients.map((patient, index) => {
        const score = Math.round(
            patient.consultations / maxVisits * 40 +
            patient.ltv / maxLtv * 40 +
            patient.nps / 10 * 20
        );

        const scoreColor =
            score >= 90
                ? 'text-emerald-500'
                : score >= 75
                    ? 'text-amber-500'
                    : 'text-rose-500';

        return `
            <tr class="border-b" style="border-color:var(--line-soft)">
                <td class="p-3 font-mono">${index + 1}</td>
                <td class="p-3 font-semibold">${escapeHTML(patient.name)}</td>
                <td class="p-3">${escapeHTML(patient.insurance)}</td>
                <td class="p-3 font-mono">${patient.consultations}</td>
                <td class="p-3" style="color:var(--muted)">
                    ${escapeHTML(patient.lastVisit)}
                </td>
                <td class="p-3 font-mono">${formatCurrency(patient.ltv)}</td>
                <td class="p-3 font-mono">${formatDecimal(patient.nps)}</td>
                <td class="p-3 font-mono font-bold ${scoreColor}">
                    ${score}
                </td>
            </tr>
        `;
    }).join('');
}

function renderBreakdown(search = '') {
    const tbody = $('#breakdownTable tbody');
    if (!tbody) return;

    const term = search.trim().toLowerCase();

    const rows = state.data.insurance.filter(item =>
        item.name.toLowerCase().includes(term)
    );

    tbody.innerHTML = rows.map(item => {
        const variationClass =
            item.variation >= 0
                ? 'text-emerald-500'
                : 'text-rose-500';

        const trend =
            item.trend === 'up'
                ? '↗'
                : '↘';

        const trendClass =
            item.trend === 'up'
                ? 'text-emerald-500'
                : 'text-rose-500';

        return `
            <tr class="border-b" style="border-color:var(--line-soft)">
                <td class="p-3 font-bold">
                    ${escapeHTML(item.name)}
                </td>

                <td class="p-3 text-right font-mono">
                    ${formatNumber(item.patients)}
                </td>

                <td class="p-3 text-right font-mono">
                    ${formatNumber(item.newPatients)}
                </td>

                <td class="p-3 text-right font-mono">
                    ${formatNumber(item.returns)}
                </td>

                <td class="p-3 text-right font-mono">
                    ${item.age} anos
                </td>

                <td class="p-3 text-right font-mono">
                    ${formatCurrency(item.ltv)}
                </td>

                <td class="p-3 text-right font-mono font-bold ${variationClass}">
                    ${item.variation >= 0 ? '+' : ''}
                    ${formatPercent(item.variation)}
                </td>

                <td class="p-3 text-lg font-bold ${trendClass}">
                    ${trend}
                </td>
            </tr>
        `;
    }).join('');

    updateTotals(rows);
}

function updateTotals(rows) {
    const patients = rows.reduce(
        (sum, item) => sum + item.patients,
        0
    );

    const newPatients = rows.reduce(
        (sum, item) => sum + item.newPatients,
        0
    );

    const returns = rows.reduce(
        (sum, item) => sum + item.returns,
        0
    );

    const age = rows.reduce(
        (sum, item) => sum + item.age * item.patients,
        0
    ) / Math.max(patients, 1);

    const ltv = rows.reduce(
        (sum, item) => sum + item.ltv * item.patients,
        0
    ) / Math.max(patients, 1);

    $('#tFTot').textContent = formatNumber(patients);
    $('#tFNew').textContent = formatNumber(newPatients);
    $('#tFRet').textContent = formatNumber(returns);
    $('#tFAge').textContent = `${formatDecimal(age)} anos`;
    $('#tFLtv').textContent = formatCurrency(ltv);
}

function animateCounters() {
    $$('[data-counter]').forEach(element => {
        const target = Number(element.dataset.counter) || 0;
        const start = performance.now();
        const duration = 1100;

        function frame(now) {
            const progress = Math.min(
                (now - start) / duration,
                1
            );

            const eased = 1 - Math.pow(1 - progress, 3);

            element.textContent = formatNumber(
                target * eased
            );

            if (progress < 1) {
                requestAnimationFrame(frame);
            }
        }

        requestAnimationFrame(frame);
    });
}

function renderAll() {
    renderNewPatients();
    renderGender();
    renderInsurance();
    renderAge();
    renderEvolution();
    renderSparklines();
    renderCities();
    renderHeatmap();
    renderRank();
    renderBreakdown();
    refreshIcons();
}

function updateLastUpdate() {
    const element = $('#lastUpdate');

    if (!element) return;

    element.textContent = new Intl.DateTimeFormat(
        'pt-BR',
        {
            dateStyle: 'short',
            timeStyle: 'short'
        }
    ).format(new Date());
}

function applyTheme() {
    const saved = localStorage.getItem('GM4med-theme');
    const systemDark = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    const dark = saved
        ? saved === 'dark'
        : systemDark;

    document.documentElement.classList.toggle('dark', dark);

    const icon = $('#toggleTheme i');

    if (icon) {
        icon.setAttribute(
            'data-lucide',
            dark ? 'sun' : 'moon'
        );
    }

    refreshIcons();
}

function bindEvents() {
    $$('.period-button').forEach(button => {
        button.addEventListener('click', () => {
            $$('.period-button').forEach(item => {
                item.classList.remove('active', 'text-white');
                item.style.background = 'transparent';
            });

            button.classList.add('active', 'text-white');
            button.style.background = 'var(--gradient)';

            state.period = button.dataset.period;

            const custom = state.period === 'custom';

            $('#dateFrom').disabled = !custom;
            $('#dateTo').disabled = !custom;

            if (!custom) {
                simulateRefresh(
                    'Período atualizado com sucesso.'
                );
            }
        });
    });

    $$('.segmented[data-target="newPatients"] button')
        .forEach(button => {
            button.addEventListener('click', () => {
                $$('.segmented[data-target="newPatients"] button')
                    .forEach(item => item.classList.remove('active'));

                button.classList.add('active');
                state.newPatientsMode = button.dataset.mode;
                renderNewPatients();
            });
        });

    $$('.segmented[data-target="evolution"] button')
        .forEach(button => {
            button.addEventListener('click', () => {
                $$('.segmented[data-target="evolution"] button')
                    .forEach(item => item.classList.remove('active'));

                button.classList.add('active');
                state.evolutionMetric = button.dataset.metric;
                renderEvolution();
            });
        });

    $$('#rankTabs button').forEach(button => {
        button.addEventListener('click', () => {
            $$('#rankTabs button').forEach(item =>
                item.classList.remove('active')
            );

            button.classList.add('active');
            state.rankMode = button.dataset.rank;
            renderRank();
        });
    });

    $('#toggleTheme').addEventListener('click', () => {
        const dark = !isDark();

        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem(
            'GM4med-theme',
            dark ? 'dark' : 'light'
        );

        const icon = $('#toggleTheme i');

        if (icon) {
            icon.setAttribute(
                'data-lucide',
                dark ? 'sun' : 'moon'
            );
        }

        refreshIcons();
        renderAll();

        showToast(
            dark
                ? 'Tema escuro ativado.'
                : 'Tema claro ativado.',
            'info'
        );
    });

    $('#btnRefresh').addEventListener('click', () => {
        simulateRefresh(
            'Dados atualizados com sucesso.'
        );
    });

    $('#btnNotifications').addEventListener('click', () => {
        showToast(
            'Nenhum alerta crítico no momento.',
            'info'
        );
    });

    $('#btnApply').addEventListener('click', () => {
        state.filters = {
            from: $('#dateFrom').value,
            to: $('#dateTo').value,
            unit: $('#fUnit').value,
            insurance: $('#fIns').value,
            age: $('#fAge').value,
            origin: $('#fOrig').value
        };

        if (
            state.period === 'custom' &&
            ((!state.filters.from && state.filters.to) ||
                (state.filters.from && !state.filters.to))
        ) {
            showToast(
                'Preencha as duas datas do período personalizado.',
                'warning'
            );

            return;
        }

        simulateRefresh(
            'Filtros aplicados com sucesso.'
        );
    });

    $('#btnClear').addEventListener('click', () => {
        ['#fUnit', '#fIns', '#fAge', '#fOrig']
            .forEach(selector => {
                $(selector).selectedIndex = 0;
            });

        $('#dateFrom').value = '';
        $('#dateTo').value = '';

        renderBreakdown('');

        showToast(
            'Filtros limpos.',
            'info'
        );
    });

    $('#tblSearch').addEventListener('input', event => {
        renderBreakdown(event.target.value);
    });

    $('#btnPrint').addEventListener('click', () => {
        showToast(
            'Preparando impressão do relatório.',
            'info'
        );

        setTimeout(() => window.print(), 300);
    });

    $('#btnExport')?.addEventListener('click', exportCSV);

    $('#btnExportCat')?.addEventListener('click', exportCSV);

    $('#btnShare').addEventListener('click', async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'GM4med BI — Relatório de Pacientes',
                    text: 'Relatório gerencial de pacientes.',
                    url: window.location.href
                });

                showToast(
                    'Relatório compartilhado.',
                    'success'
                );
            } else {
                await navigator.clipboard.writeText(
                    window.location.href
                );

                showToast(
                    'Link copiado para a área de transferência.',
                    'success'
                );
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                showToast(
                    'Não foi possível compartilhar o relatório.',
                    'danger'
                );
            }
        }
    });
}

function buildCSVContent() {
    const header = [
        'Convenio',
        'Pacientes',
        'Novos',
        'Retorno',
        'Idade media',
        'LTV medio',
        'Variacao (%)',
        'Tendencia'
    ];

    const term = ($('#tblSearch')?.value || '')
        .trim()
        .toLowerCase();

    const rows = state.data.insurance
        .filter(item => item.name.toLowerCase().includes(term))
        .map(item => [
            item.name,
            item.patients,
            item.newPatients,
            item.returns,
            item.age,
            item.ltv,
            formatDecimal(item.variation),
            item.trend === 'up' ? 'Alta' : 'Baixa'
        ]);

    const escapeCell = value => {
        const text = String(value ?? '');

        return /[";\n]/.test(text)
            ? `"${text.replaceAll('"', '""')}"`
            : text;
    };

    return [header, ...rows]
        .map(row => row.map(escapeCell).join(';'))
        .join('\r\n');
}

function exportCSV() {
    try {
        const content = buildCSVContent();

        // BOM garante acentuacao correta ao abrir no Excel
        const blob = new Blob(
            [`\uFEFF${content}`],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const stamp = new Date()
            .toISOString()
            .slice(0, 10);

        link.href = url;
        link.download = `GM4med-pacientes-convenios-${stamp}.csv`;
        link.rel = 'noopener';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showToast('Arquivo CSV exportado.', 'success');
    } catch (error) {
        console.error('Falha ao exportar CSV:', error);
        showToast('Não foi possível exportar o CSV.', 'danger');
    }
}

function simulateRefresh(message) {
    document.body.classList.add('loading');

    setTimeout(() => {
        state.data = makeData();
        renderAll();
        animateCounters();
        updateLastUpdate();
        document.body.classList.remove('loading');
        showToast(message, 'success');
    }, 450);
}

function initialize() {
    state.data = makeData();

    applyTheme();
    bindEvents();

    $('#dateFrom').disabled = true;
    $('#dateTo').disabled = true;

    renderAll();
    animateCounters();
    updateLastUpdate();

    window.addEventListener('resize', () => {
        charts.forEach(chart => {
            if (typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    });

    setInterval(updateLastUpdate, 60000);
    refreshIcons();
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        initialize,
        { once: true }
    );
} else {
    initialize();
}
