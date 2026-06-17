/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { Content, InfoCard, Page } from '@backstage/core-components';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Divider from '@material-ui/core/Divider';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { makeStyles } from '@material-ui/core/styles';

// ─── Demo data ───────────────────────────────────────────────────────────────

const MEDIAN_CYCLE_DATA = [
  { label: '2026-06-09', daily: 5, avg: 8 },
  { label: '2026-06-10', daily: 12, avg: 9 },
  { label: '2026-06-11', daily: 3, avg: 8.5 },
  { label: '2026-06-12', daily: 8, avg: 8.2 },
  { label: '2026-06-13', daily: 15, avg: 9 },
  { label: '2026-06-14', daily: 6, avg: 8.8 },
  { label: '2026-06-15', daily: 10, avg: 9.1 },
];

const SCATTER_DATA = [
  { x: 5, y: 20 },
  { x: 12, y: 45 },
  { x: 25, y: 80 },
  { x: 35, y: 100 },
  { x: 50, y: 150 },
  { x: 8, y: 30 },
  { x: 60, y: 300 },
  { x: 18, y: 55 },
  { x: 40, y: 120 },
  { x: 75, y: 320 },
  { x: 90, y: 350 },
  { x: 100, y: 280 },
  { x: 110, y: 450 },
  { x: 130, y: 500 },
  { x: 22, y: 70 },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles(theme => ({
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#000',
    marginBottom: theme.spacing(1),
  },
  tabBar: {
    marginBottom: theme.spacing(2),
    borderBottom: '1px solid #e0e0e0',
  },
  tabIndicator: {
    backgroundColor: '#c00',
  },
  tabLabel: {
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    fontSize: '0.75rem',
    minWidth: 100,
  },
  activeTabLabel: {
    color: '#c00',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1),
    flexWrap: 'wrap' as const,
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: theme.palette.text.secondary,
  },
  filterSelect: {
    minWidth: 160,
    fontSize: '0.85rem',
  },
  dateRange: {
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  refreshText: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },

  // Key Metrics card
  keyMetricsCard: {
    borderLeft: '4px solid #c00',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
  },
  metricCell: {
    textAlign: 'center' as const,
    padding: theme.spacing(1),
  },
  metricNumber: {
    fontSize: '2.2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#222',
  },
  metricDesc: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: 2,
  },

  // Cycle Time Breakdown
  pipelineRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: theme.spacing(3, 0),
  },
  pipelineStage: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  pipelineCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pipelineLabel: {
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'block',
  },
  pipelineValue: {
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  pipelineLine: {
    width: 40,
    minWidth: 20,
    height: 3,
    flexShrink: 0,
    marginTop: 17,
  },

  // Card header with info icon
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },

  // Donut chart legend
  legendRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    fontSize: '0.75rem',
  },
  legendDot: {
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
    verticalAlign: 'middle',
  },

  // Chart legend for line chart
  chartLegend: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(2),
    fontSize: '0.7rem',
    marginBottom: theme.spacing(0.5),
  },
  chartLegendLine: {
    display: 'inline-block',
    width: 16,
    height: 3,
    borderRadius: 2,
    marginRight: 4,
    verticalAlign: 'middle',
  },
}));

// ─── Card title helper ───────────────────────────────────────────────────────

function CardTitle({ label }: { label: string }) {
  const classes = useStyles();
  return (
    <span className={classes.cardHeader}>
      {label}
      <Tooltip title={label}>
        <IconButton size="small">
          <InfoOutlinedIcon style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </span>
  );
}

// ─── Key Metrics ─────────────────────────────────────────────────────────────

function KeyMetricsCard() {
  const classes = useStyles();
  const simpleMetrics = [
    { value: '32', desc: 'Total Closed PRs' },
    { value: '8.6', desc: 'Median Cycle Time (hours)' },
    { value: '53', desc: 'Opened PRs' },
    { value: '1.5', desc: 'Median Interaction Time (hours)' },
  ];
  const unitStyle = {
    fontSize: '0.6rem',
    fontWeight: 400 as const,
    marginLeft: 3,
  };
  return (
    <InfoCard
      title={<CardTitle label="Key Metrics" />}
      className={classes.keyMetricsCard}
    >
      <div className={classes.metricsGrid}>
        {simpleMetrics.map(m => (
          <div key={m.desc} className={classes.metricCell}>
            <Typography className={classes.metricNumber}>{m.value}</Typography>
            <Typography className={classes.metricDesc}>{m.desc}</Typography>
          </div>
        ))}
        <div
          className={classes.metricCell}
          style={{
            borderTop: '1px solid #e0e0e0',
            paddingTop: 12,
            textAlign: 'center',
          }}
        >
          <Typography
            className={classes.metricNumber}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'baseline',
              whiteSpace: 'nowrap',
            }}
          >
            1<span style={unitStyle}>day</span>&nbsp;5
            <span style={unitStyle}>hours</span>
          </Typography>
          <Typography className={classes.metricDesc}>
            Est. Time Saved from Self-Service Actions
          </Typography>
        </div>
        <div
          className={classes.metricCell}
          style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12 }}
        >
          <Typography className={classes.metricNumber}>10</Typography>
          <Typography className={classes.metricDesc}>
            Self-Service Actions Taken
          </Typography>
        </div>
      </div>
    </InfoCard>
  );
}

// ─── Cycle Time Breakdown ────────────────────────────────────────────────────

function CycleTimeBreakdownCard() {
  const classes = useStyles();
  const stages = [
    { label: 'First Review', value: '1.5 hours', color: '#4caf50' },
    { label: 'First Approval', value: '1.2 hours', color: '#ffc107' },
    { label: 'Integration', value: '9.6 hours', color: '#7b1fa2' },
  ];
  return (
    <InfoCard title={<CardTitle label="Cycle Time Breakdown" />}>
      <div className={classes.pipelineRow}>
        {stages.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && (
              <div
                className={classes.pipelineLine}
                style={{ backgroundColor: stages[i - 1].color }}
              />
            )}
            <div className={classes.pipelineStage}>
              <div
                className={classes.pipelineCircle}
                style={{
                  border: `3px solid ${s.color}`,
                  backgroundColor: `${s.color}20`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    fill={s.color}
                  />
                </svg>
              </div>
              <span className={classes.pipelineLabel}>{s.label}</span>
              <span className={classes.pipelineValue}>{s.value}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </InfoCard>
  );
}

// ─── Median Cycle Time (line chart) ──────────────────────────────────────────

const MCT_W = 340;
const MCT_H = 170;
const MCT_PAD = { top: 10, right: 10, bottom: 30, left: 30 };
const MCT_PW = MCT_W - MCT_PAD.left - MCT_PAD.right;
const MCT_PH = MCT_H - MCT_PAD.top - MCT_PAD.bottom;
const MCT_MAX = 20;

function mctX(i: number) {
  return MCT_PAD.left + (i / (MEDIAN_CYCLE_DATA.length - 1)) * MCT_PW;
}
function mctY(v: number) {
  return MCT_PAD.top + MCT_PH - (v / MCT_MAX) * MCT_PH;
}

function MedianCycleTimeCard() {
  const classes = useStyles();
  const avgLine = MEDIAN_CYCLE_DATA.map(
    (d, i) => `${mctX(i)},${mctY(d.avg)}`,
  ).join(' ');
  return (
    <InfoCard title={<CardTitle label="Median Cycle Time (hours)" />}>
      <div className={classes.chartLegend}>
        <span>
          <span
            className={classes.chartLegendLine}
            style={{ background: '#26a69a' }}
          />
          Daily Median (hours)
        </span>
        <span>
          <span
            className={classes.chartLegendLine}
            style={{ background: '#e91e63' }}
          />
          7-day Rolling Avg (hours)
        </span>
      </div>
      <svg
        viewBox={`0 0 ${MCT_W} ${MCT_H}`}
        width="100%"
        style={{ display: 'block' }}
      >
        {[0, 5, 10, 15, 20].map(t => (
          <g key={t}>
            <line
              x1={MCT_PAD.left}
              y1={mctY(t)}
              x2={MCT_PAD.left + MCT_PW}
              y2={mctY(t)}
              stroke="#eee"
              strokeWidth={1}
            />
            <text
              x={MCT_PAD.left - 6}
              y={mctY(t) + 4}
              textAnchor="end"
              fontSize={9}
              fill="#999"
            >
              {t}
            </text>
          </g>
        ))}
        {MEDIAN_CYCLE_DATA.map((d, i) => (
          <text
            key={d.label}
            x={mctX(i)}
            y={MCT_H - 6}
            textAnchor="middle"
            fontSize={7}
            fill="#999"
          >
            {d.label.slice(5)}
          </text>
        ))}
        <polyline
          points={avgLine}
          fill="none"
          stroke="#e91e63"
          strokeWidth={2}
        />
        {MEDIAN_CYCLE_DATA.map((d, i) => (
          <circle
            key={`dot-${i}`}
            cx={mctX(i)}
            cy={mctY(d.daily)}
            r={4}
            fill="#26a69a"
          />
        ))}
      </svg>
    </InfoCard>
  );
}

// ─── PR Productivity (donut chart) ───────────────────────────────────────────

function PRProductivityCard() {
  const classes = useStyles();
  const merged = 90;
  const closed = 10;
  const r = 70;
  const cx = 100;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const mergedArc = (merged / 100) * circumference;
  const closedArc = (closed / 100) * circumference;

  return (
    <InfoCard title={<CardTitle label="PR Productivity" />}>
      <svg
        viewBox="0 0 200 200"
        width="100%"
        style={{ display: 'block', maxWidth: 200, margin: '0 auto' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#ef5350"
          strokeWidth={20}
          strokeDasharray={`${closedArc} ${circumference - closedArc}`}
          strokeDashoffset={-mergedArc}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#4caf50"
          strokeWidth={20}
          strokeDasharray={`${mergedArc} ${circumference - mergedArc}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle cx={cx} cy={cy} r={55} fill="white" />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={11}
          fill="#ef5350"
          fontWeight={600}
        >
          10%
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize={16}
          fill="#4caf50"
          fontWeight={700}
        >
          90%
        </text>
      </svg>
      <div className={classes.legendRow}>
        <span>
          <span
            className={classes.legendDot}
            style={{ background: '#4caf50' }}
          />
          Merged
        </span>
        <span>
          <span
            className={classes.legendDot}
            style={{ background: '#ef5350' }}
          />
          Closed w/o Merge
        </span>
      </div>
    </InfoCard>
  );
}

// ─── PR Size Distribution (scatter plot) ─────────────────────────────────────

const SC_W = 260;
const SC_H = 200;
const SC_PAD = { top: 10, right: 10, bottom: 30, left: 45 };
const SC_PW = SC_W - SC_PAD.left - SC_PAD.right;
const SC_PH = SC_H - SC_PAD.top - SC_PAD.bottom;
const SC_X_MAX = 140;
const SC_Y_MAX = 550;

function scX(v: number) {
  return SC_PAD.left + (v / SC_X_MAX) * SC_PW;
}
function scY(v: number) {
  return SC_PAD.top + SC_PH - (v / SC_Y_MAX) * SC_PH;
}

function PRSizeDistributionCard() {
  const classes = useStyles();
  return (
    <InfoCard title={<CardTitle label="PR Size Distribution" />}>
      <div className={classes.chartLegend}>
        <span>
          <span
            className={classes.chartLegendLine}
            style={{ background: '#26a69a' }}
          />
          PR Size
        </span>
      </div>
      <svg
        viewBox={`0 0 ${SC_W} ${SC_H}`}
        width="100%"
        style={{ display: 'block' }}
      >
        {[0, 100, 200, 300, 400, 500].map(t => (
          <g key={t}>
            <line
              x1={SC_PAD.left}
              y1={scY(t)}
              x2={SC_PAD.left + SC_PW}
              y2={scY(t)}
              stroke="#eee"
              strokeWidth={1}
            />
            <text
              x={SC_PAD.left - 6}
              y={scY(t) + 4}
              textAnchor="end"
              fontSize={9}
              fill="#999"
            >
              {t}
            </text>
          </g>
        ))}
        {[0, 20, 40, 60, 80, 100, 120, 140].map(t => (
          <text
            key={`x-${t}`}
            x={scX(t)}
            y={SC_H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#999"
          >
            {t}
          </text>
        ))}
        <text
          x={SC_W / 2}
          y={SC_H}
          textAnchor="middle"
          fontSize={9}
          fill="#666"
        >
          Lines Removed
        </text>
        <text
          x={10}
          y={SC_H / 2}
          textAnchor="middle"
          fontSize={9}
          fill="#666"
          transform={`rotate(-90 10 ${SC_H / 2})`}
        >
          Lines Added
        </text>
        {SCATTER_DATA.map((d, i) => (
          <circle
            key={i}
            cx={scX(d.x)}
            cy={scY(d.y)}
            r={4}
            fill="#26a69a"
            opacity={0.7}
          />
        ))}
      </svg>
    </InfoCard>
  );
}

// ─── PR Stage Flow (Sankey-style) ────────────────────────────────────────────

function PRStageFlowCard() {
  const W = 220;
  const H = 200;
  const colX = [20, 80, 140, 200];
  const barW = 16;

  const total = H - 40;
  const reviewed = total * 0.55;
  const approved = total * 0.7;
  const merged = total * 0.6;
  const abandoned = total * 0.12;

  const totalY = 20;
  const reviewedY = 30;
  const approvedY = 25;
  const mergedY = 30;
  const abandonedY = totalY + total - abandoned;

  return (
    <InfoCard title={<CardTitle label="PR Stage Flow" />}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Total bar */}
        <rect
          x={colX[0]}
          y={totalY}
          width={barW}
          height={total}
          rx={2}
          fill="#26a69a"
        />
        <text
          x={colX[0] + barW / 2}
          y={totalY + total / 2}
          textAnchor="middle"
          fontSize={8}
          fill="#fff"
          fontWeight={600}
          transform={`rotate(-90 ${colX[0] + barW / 2} ${totalY + total / 2})`}
        >
          Total
        </text>

        {/* Reviewed bar */}
        <rect
          x={colX[1]}
          y={reviewedY}
          width={barW}
          height={reviewed}
          rx={2}
          fill="#42a5f5"
        />
        <text
          x={colX[1] + barW / 2}
          y={reviewedY + reviewed / 2}
          textAnchor="middle"
          fontSize={7}
          fill="#fff"
          fontWeight={600}
          transform={`rotate(-90 ${colX[1] + barW / 2} ${
            reviewedY + reviewed / 2
          })`}
        >
          Reviewed
        </text>

        {/* Approved bar */}
        <rect
          x={colX[2]}
          y={approvedY}
          width={barW}
          height={approved}
          rx={2}
          fill="#66bb6a"
        />
        <text
          x={colX[2] + barW / 2}
          y={approvedY + approved / 2}
          textAnchor="middle"
          fontSize={7}
          fill="#fff"
          fontWeight={600}
          transform={`rotate(-90 ${colX[2] + barW / 2} ${
            approvedY + approved / 2
          })`}
        >
          Approved
        </text>

        {/* Merged bar */}
        <rect
          x={colX[3]}
          y={mergedY}
          width={barW}
          height={merged}
          rx={2}
          fill="#ab47bc"
        />
        <text
          x={colX[3] + barW / 2}
          y={mergedY + merged / 2}
          textAnchor="middle"
          fontSize={8}
          fill="#fff"
          fontWeight={600}
          transform={`rotate(-90 ${colX[3] + barW / 2} ${
            mergedY + merged / 2
          })`}
        >
          Merged
        </text>

        {/* Abandoned bar */}
        <rect
          x={colX[3]}
          y={abandonedY + 10}
          width={barW}
          height={abandoned}
          rx={2}
          fill="#ef5350"
        />
        <text
          x={colX[3] + barW / 2}
          y={abandonedY + 10 + abandoned / 2 + 3}
          textAnchor="middle"
          fontSize={6}
          fill="#fff"
          fontWeight={600}
        >
          Abn.
        </text>

        {/* Flow paths: Total -> Reviewed */}
        <path
          d={`M${colX[0] + barW},${totalY + 10} C${colX[0] + barW + 20},${
            totalY + 10
          } ${colX[1] - 20},${reviewedY + 5} ${colX[1]},${reviewedY + 5}`}
          fill="none"
          stroke="#42a5f5"
          strokeWidth={reviewed * 0.15}
          opacity={0.25}
        />
        {/* Total -> Approved (direct) */}
        <path
          d={`M${colX[0] + barW},${totalY + total * 0.4} C${
            colX[0] + barW + 30
          },${totalY + total * 0.4} ${colX[2] - 30},${approvedY + 10} ${
            colX[2]
          },${approvedY + 10}`}
          fill="none"
          stroke="#66bb6a"
          strokeWidth={approved * 0.08}
          opacity={0.2}
        />
        {/* Reviewed -> Approved */}
        <path
          d={`M${colX[1] + barW},${reviewedY + 15} C${colX[1] + barW + 20},${
            reviewedY + 15
          } ${colX[2] - 20},${approvedY + 30} ${colX[2]},${approvedY + 30}`}
          fill="none"
          stroke="#66bb6a"
          strokeWidth={reviewed * 0.12}
          opacity={0.25}
        />
        {/* Approved -> Merged */}
        <path
          d={`M${colX[2] + barW},${approvedY + 20} C${colX[2] + barW + 20},${
            approvedY + 20
          } ${colX[3] - 20},${mergedY + 15} ${colX[3]},${mergedY + 15}`}
          fill="none"
          stroke="#ab47bc"
          strokeWidth={merged * 0.12}
          opacity={0.25}
        />
        {/* Total -> Abandoned */}
        <path
          d={`M${colX[0] + barW},${totalY + total - 10} C${
            colX[0] + barW + 40
          },${totalY + total} ${colX[3] - 40},${abandonedY + 15} ${colX[3]},${
            abandonedY + 15
          }`}
          fill="none"
          stroke="#ef5350"
          strokeWidth={abandoned * 0.3}
          opacity={0.2}
        />
      </svg>
    </InfoCard>
  );
}

// ─── PR Z-Score (horizontal bar chart) ───────────────────────────────────────

function PRZScoreCard() {
  const classes = useStyles();
  const data = [
    { label: 'Fast', count: 5, color: '#4caf50' },
    { label: 'Average', count: 8, color: '#9e9e9e' },
    { label: 'Slow', count: 3, color: '#ef5350' },
  ];
  const maxVal = 10;
  const barH = 24;
  const labelW = 55;
  const chartW = 220;
  const gap = 16;
  const totalH = data.length * (barH + gap) + 20;

  return (
    <InfoCard title={<CardTitle label="PR Z-Score (cycle time)" />}>
      <div className={classes.chartLegend}>
        <span>
          <span
            className={classes.chartLegendLine}
            style={{ background: '#4caf50' }}
          />
          PR count
        </span>
      </div>
      <svg
        viewBox={`0 0 ${labelW + chartW + 20} ${totalH}`}
        width="100%"
        style={{ display: 'block' }}
      >
        {data.map((d, i) => {
          const y = 10 + i * (barH + gap);
          const w = (d.count / maxVal) * chartW;
          return (
            <g key={d.label}>
              <text
                x={labelW - 6}
                y={y + barH / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill="#333"
                fontWeight={500}
              >
                {d.label}
              </text>
              <rect
                x={labelW}
                y={y}
                width={w}
                height={barH}
                rx={3}
                fill={d.color}
              />
            </g>
          );
        })}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => (
          <text
            key={t}
            x={labelW + (t / maxVal) * chartW}
            y={totalH - 2}
            textAnchor="middle"
            fontSize={8}
            fill="#999"
          >
            {t}
          </text>
        ))}
        <text
          x={labelW + chartW / 2}
          y={totalH + 8}
          textAnchor="middle"
          fontSize={9}
          fill="#666"
        >
          PR count
        </text>
      </svg>
    </InfoCard>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function EngineeringInsightsPage() {
  const classes = useStyles();

  return (
    <Page themeId="tool">
      <Content>
        <Typography className={classes.pageTitle}>
          Engineering Insights
        </Typography>

        <Tabs
          value={0}
          className={classes.tabBar}
          classes={{ indicator: classes.tabIndicator }}
        >
          <Tab
            label="PR Cycle Time"
            className={`${classes.tabLabel} ${classes.activeTabLabel}`}
          />
          <Tab
            label="AI Commit Scanner"
            className={classes.tabLabel}
            disabled
          />
          <Tab label="AI Review" className={classes.tabLabel} disabled />
          <Tab
            label="First Time Pass Rate"
            className={classes.tabLabel}
            disabled
          />
        </Tabs>

        <div className={classes.filterRow}>
          <Typography className={classes.filterLabel}>Repository:</Typography>
          <Select
            value="all"
            variant="outlined"
            className={classes.filterSelect}
          >
            <MenuItem value="all">All Repositories (2)</MenuItem>
          </Select>
          <Typography className={classes.filterLabel}>Time Range:</Typography>
          <Select
            value="30"
            variant="outlined"
            className={classes.filterSelect}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
          <Typography className={classes.dateRange}>
            Showing <strong>May 17, 2026 — Jun 16, 2026</strong>
          </Typography>
        </div>
        <Typography className={classes.refreshText}>
          Last refresh (UTC): Jun 16, 2026 at 08:38 AM
        </Typography>

        <Divider style={{ marginBottom: 16 }} />

        {/* Top row — 3 cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <KeyMetricsCard />
          </Grid>
          <Grid item xs={12} md={4}>
            <CycleTimeBreakdownCard />
          </Grid>
          <Grid item xs={12} md={4}>
            <MedianCycleTimeCard />
          </Grid>
        </Grid>

        {/* Bottom row — 4 cards */}
        <Box mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <PRProductivityCard />
            </Grid>
            <Grid item xs={12} md={3}>
              <PRSizeDistributionCard />
            </Grid>
            <Grid item xs={12} md={3}>
              <PRStageFlowCard />
            </Grid>
            <Grid item xs={12} md={3}>
              <PRZScoreCard />
            </Grid>
          </Grid>
        </Box>
      </Content>
    </Page>
  );
}
