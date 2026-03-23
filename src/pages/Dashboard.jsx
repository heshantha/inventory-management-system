import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { formatCurrency } from '../utils/calculations';
import {
    DollarSign,
    ShoppingCart,
    Package,
    AlertTriangle,
    TrendingUp,
    Wrench,
    Calendar
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const { shopId } = useShop();
    const [stats, setStats] = useState(null);
    const [allSales, setAllSales] = useState([]);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (shopId) loadDashboardData();
    }, [shopId]);

    const loadDashboardData = async () => {
        try {
            const [statsData, allSalesData, todaySalesData] = await Promise.all([
                api.dashboard.getStats(shopId),
                api.sales.getAll(shopId),
                api.sales.getToday(shopId),
            ]);

            const repairs = todaySalesData.filter(sale =>
                sale.items && sale.items.some(item => item.name && item.name.toString().startsWith('Service Charges'))
            );
            const salesOnly = todaySalesData.filter(sale =>
                !sale.items || !sale.items.some(item => item.name && item.name.toString().startsWith('Service Charges'))
            );

            const repairTotal = repairs.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
            const salesTotal = salesOnly.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

            setStats({
                ...statsData,
                today_sales_only: salesTotal,
                today_repair_amount: repairTotal,
                today_transactions_count: todaySalesData.length,
            });
            setAllSales(allSalesData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Build daily data: Last 30 days ──
    const buildDailyData = () => {
        const data = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const daySales = allSales.filter(s => s.created_at && s.created_at.startsWith(dateStr));
            const total = daySales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
            
            // Format label: "Mar 21"
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            data.push({ date: dateStr, label, total, count: daySales.length });
        }
        return data;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    const statCards = [
        {
            title: "Today's Sales",
            value: formatCurrency(stats?.today_sales_only || 0),
            icon: DollarSign,
            color: 'bg-green-500',
            textColor: 'text-green-600',
        },
        {
            title: "Today's Repair Amount",
            value: formatCurrency(stats?.today_repair_amount || 0),
            icon: Wrench,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
        },
        {
            title: "Today's Transactions",
            value: stats?.today_transactions_count || 0,
            icon: ShoppingCart,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
        },
        {
            title: 'Total Products',
            value: stats?.total_products || 0,
            icon: Package,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
        },
    ];

    const dailyData = buildDailyData();
    const maxVal = Math.max(...dailyData.map(d => d.total), 1);
    
    // Line chart dimensions - Expanded for full width
    const CHART_H = 260; // Slightly taller for full width
    const CHART_W = 1000; // Wider viewBox for full width
    const PADDING_L = 50;
    const PADDING_R = 30;
    const PADDING_T = 30;
    const PADDING_B = 40;
    
    const DRAW_W = CHART_W - PADDING_L - PADDING_R;
    const DRAW_H = CHART_H - PADDING_T - PADDING_B;
    const GAP = DRAW_W / (dailyData.length - 1);

    // Calculate line path
    const points = dailyData.map((d, i) => {
        const x = PADDING_L + (i * GAP);
        const y = PADDING_T + DRAW_H - (d.total / maxVal) * DRAW_H;
        return { x, y, ...d, index: i };
    });

    const linePath = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `M${points[0].x},${CHART_H - PADDING_B} ` + 
                     points.map(p => `${p.x},${p.y}`).join(' ') + 
                     ` L${points[points.length-1].x},${CHART_H - PADDING_B} Z`;

    return (
        <div className="p-6 space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, {user?.full_name}!
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening in your store today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sales Trend - Full Width */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-green-600" size={24} />
                    <h2 className="text-2xl font-bold text-gray-800">Sales Performance Trend</h2>
                    <span className="ml-auto bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Last 30 Days
                    </span>
                </div>

                {/* ── Daily Line Chart ── */}
                <div className="rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-4 mb-2 min-h-[350px] relative flex flex-col justify-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4 pl-4">
                        Revenue Analytics
                    </p>
                    
                    <div className="w-full">
                        <svg
                            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            {/* Y-axis grid lines & labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map(f => {
                                const y = PADDING_T + DRAW_H * (1 - f);
                                return (
                                    <g key={f}>
                                        <line x1={PADDING_L} y1={y} x2={CHART_W - PADDING_R} y2={y} stroke="#f1f5f9" strokeWidth={1.5} />
                                        <text x={PADDING_L - 12} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={11} fontWeight="500">
                                            {f === 0 ? '0' : (maxVal * f >= 1000 ? `${(maxVal * f / 1000).toFixed(1)}k` : Math.round(maxVal * f))}
                                        </text>
                                    </g>
                                );
                            })}

                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                                </linearGradient>
                            </defs>

                            {/* Area Fill */}
                            <path d={areaPath} fill="url(#lineGradient)" />

                            {/* Trend Line */}
                            <polyline
                                points={linePath}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth={3.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Data points */}
                            {points.map((p, i) => (
                                <g key={i}>
                                    {/* Invisible larger hover area */}
                                    <rect
                                        x={p.x - GAP/2} y={PADDING_T} width={GAP} height={DRAW_H}
                                        fill="transparent"
                                        onMouseEnter={() => setHoveredPoint(i)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    
                                    {/* Point circle */}
                                    <circle
                                        cx={p.x} cy={p.y} 
                                        r={hoveredPoint === i ? 6 : 4} 
                                        fill={hoveredPoint === i ? '#059669' : '#10b981'}
                                        stroke="white" strokeWidth={2}
                                        style={{ transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                    />

                                    {/* X-axis labels */}
                                    {(i % 5 === 0 || i === dailyData.length - 1) && (
                                        <text
                                            x={p.x} y={CHART_H - 10}
                                            textAnchor="middle"
                                            fill="#64748b"
                                            fontSize={11}
                                            fontWeight="600"
                                        >
                                            {p.label}
                                        </text>
                                    )}

                                    {/* Tooltip on point */}
                                    {hoveredPoint === i && (
                                        <g>
                                            <rect 
                                                x={p.x < CHART_W / 2 ? p.x + 15 : p.x - 115} 
                                                y={p.y - 45} 
                                                width={100} height={40} rx={8} 
                                                fill="#1e293b" 
                                                filter="drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))"
                                            />
                                            <text 
                                                x={p.x < CHART_W / 2 ? p.x + 65 : p.x - 65} 
                                                y={p.y - 28} 
                                                textAnchor="middle" fill="white" fontSize={10} fontWeight="700"
                                            >
                                                {p.label}: {formatCurrency(p.total)}
                                            </text>
                                            <text 
                                                x={p.x < CHART_W / 2 ? p.x + 65 : p.x - 65} 
                                                y={p.y - 14} 
                                                textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight="500"
                                            >
                                                {p.count} transactions
                                            </text>
                                        </g>
                                    )}
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 mt-4 px-4 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Real-time 30-day revenue analytics</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Monthly Revenue</span>
                        <span className="text-xl font-bold text-slate-900">{formatCurrency(dailyData.reduce((s,d) => s+d.total,0))}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
