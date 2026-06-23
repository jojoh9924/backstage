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

import { useState, useEffect } from 'react';
import { Content, InfoCard, Page, Progress } from '@backstage/core-components';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Link } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core/styles';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

const CHART_DATA = [
  { label: 'May 11, 2026', returning: 110, new: 18 },
  { label: 'May 18, 2026', returning: 130, new: 25 },
  { label: 'May 25, 2026', returning: 170, new: 30 },
  { label: 'Jun 1, 2026', returning: 195, new: 35 },
  { label: 'Jun 8, 2026', returning: 160, new: 28 },
];

const TOP_TEMPLATES = [
  { name: 'Create React App Template', executions: 11, timeSaved: '55hrs' },
  { name: 'Documentation Template', executions: 10, timeSaved: '20hrs' },
  { name: 'Spring Boot gRPC Service', executions: 2, timeSaved: '16hrs' },
];

function computeCompletenessScore(entity: Entity): number {
  let score = 0;
  const meta = entity.metadata;
  const spec = entity.spec as Record<string, unknown> | undefined;

  if (meta.description && (meta.description as string).length > 0) score += 1.5;
  if (meta.tags && (meta.tags as string[]).length > 0) score += 1;
  if (meta.links && (meta.links as unknown[]).length > 0) score += 1;
  if (spec?.owner) score += 1.5;
  if (spec?.system) score += 1.5;
  if (spec?.lifecycle) score += 1;

  const annotations = meta.annotations ?? {};
  if (annotations['backstage.io/techdocs-ref']) score += 1;
  if (annotations['backstage.io/source-location'] || annotations['backstage.io/source-template']) score += 1;

  const remaining = Object.keys(annotations).filter(
    k =>
      !k.startsWith('backstage.io/managed-by') &&
      !k.startsWith('backstage.io/view-url') &&
      !k.startsWith('backstage.io/edit-url'),
  );
  if (remaining.length >= 3) score += 0.5;

  return Math.min(score, 10);
}

const COMPLETENESS_TIERS = [
  { label: 'Low (0\u20133.9)', min: 0, max: 4, color: '#d32f2f' },
  { label: 'Medium (4\u20136.9)', min: 4, max: 7, color: '#f9a825' },
  { label: 'High (7\u20139.9)', min: 7, max: 10, color: '#2e7d32' },
  { label: 'Perfect (10)', min: 10, max: 10.1, color: '#1565c0' },
];

const CHART_W = 460;
const CHART_H = 200;
const CHART_PAD = { top: 10, right: 10, bottom: 30, left: 40 };
const PLOT_W = CHART_W - CHART_PAD.left - CHART_PAD.right;
const PLOT_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom;
const Y_MAX = 220;
const Y_TICKS = [0, 55, 110, 165, 220];

function toX(i: number) {
  return CHART_PAD.left + (i / (CHART_DATA.length - 1)) * PLOT_W;
}
function toY(v: number) {
  return CHART_PAD.top + PLOT_H - (v / Y_MAX) * PLOT_H;
}

const returningPoints = CHART_DATA.map(
  (d, i) => `${toX(i)},${toY(d.returning)}`,
).join(' ');
const newPoints = CHART_DATA.map((d, i) => `${toX(i)},${toY(d.new)}`).join(' ');

const useStyles = makeStyles(theme => ({
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#000',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  periodSelect: {
    minWidth: 150,
  },
  metricCard: {
    textAlign: 'center' as const,
    padding: theme.spacing(2),
  },
  metricValue: {
    fontSize: 'clamp(1.4rem, 3vw, 2.4rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
  },
  metricUnit: {
    fontSize: 'clamp(0.7rem, 1.2vw, 1rem)',
    fontWeight: 400,
    marginLeft: 4,
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto auto',
    gridTemplateRows: 'auto auto auto',
    columnGap: theme.spacing(8),
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4),
    justifyContent: 'start',
  },
  metricFromLabel: {
    gridColumn: 2,
    gridRow: 1,
    textAlign: 'left' as const,
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
  },
  teamSelect: {
    minWidth: 140,
    marginTop: theme.spacing(1),
  },
  timeSavedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.85rem',
    textDecoration: 'none',
    cursor: 'pointer',
    color: theme.palette.primary.main,
  },
  chartSummary: {
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(3),
    marginTop: theme.spacing(1),
    fontSize: '0.8rem',
  },
  legendDot: {
    display: 'inline-block',
    width: 12,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
    verticalAlign: 'middle',
  },
  templateLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  completenessLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    fontSize: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  completenessLegendDot: {
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
    verticalAlign: 'middle',
  },
  previewPanel: {
    marginTop: theme.spacing(2),
    maxHeight: 200,
    overflowY: 'auto' as const,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  previewTierLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
  },
}));

function ActiveUsersChart() {
  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      width="100%"
      style={{ display: 'block' }}
    >
      {Y_TICKS.map(t => (
        <g key={t}>
          <line
            x1={CHART_PAD.left}
            y1={toY(t)}
            x2={CHART_PAD.left + PLOT_W}
            y2={toY(t)}
            stroke="#e0e0e0"
            strokeWidth={1}
          />
          <text
            x={CHART_PAD.left - 8}
            y={toY(t) + 4}
            textAnchor="end"
            fontSize={11}
            fill="#999"
          >
            {t}
          </text>
        </g>
      ))}
      {CHART_DATA.map((d, i) => (
        <text
          key={d.label}
          x={toX(i)}
          y={CHART_H - 6}
          textAnchor="middle"
          fontSize={10}
          fill="#999"
        >
          {d.label.replace(', 2026', '')}
        </text>
      ))}
      <polyline
        points={returningPoints}
        fill="none"
        stroke="#333"
        strokeWidth={2}
      />
      <polyline
        points={newPoints}
        fill="none"
        stroke="#90caf9"
        strokeWidth={2}
      />
      {CHART_DATA.map((d, i) => (
        <g key={`dots-${i}`}>
          <circle cx={toX(i)} cy={toY(d.returning)} r={3} fill="#333" />
          <circle cx={toX(i)} cy={toY(d.new)} r={3} fill="#90caf9" />
        </g>
      ))}
    </svg>
  );
}

function CompletenessScoreChart() {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const [components, setComponents] = useState<
    { name: string; owner: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    catalogApi
      .getEntities({ filter: { kind: 'Component' } })
      .then(response => {
        setComponents(
          response.items.map(entity => ({
            name: entity.metadata.name,
            owner: ((entity.spec as Record<string, unknown> | undefined)?.owner as string) ?? 'unknown',
            score: computeCompletenessScore(entity),
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [catalogApi]);

  if (loading) {
    return (
      <InfoCard title="Completeness Score Distribution">
        <Progress />
      </InfoCard>
    );
  }

  const tierCounts = COMPLETENESS_TIERS.map(tier => ({
    ...tier,
    count: components.filter(
      c => c.score >= tier.min && c.score < tier.max,
    ).length,
  }));

  const total = components.length;
  const r = 70;
  const cx = 100;
  const cy = 95;
  const circumference = 2 * Math.PI * r;

  let cumulativeArc = 0;
  const segments = tierCounts
    .filter(t => t.count > 0)
    .map(tier => {
      const arc = (tier.count / total) * circumference;
      const seg = { ...tier, arc, offset: -cumulativeArc };
      cumulativeArc += arc;
      return seg;
    });

  return (
    <InfoCard title="Completeness Score Distribution">
      <Typography className={classes.chartSummary}>
        All teams &mdash; {total} components
      </Typography>
      <svg
        viewBox="0 0 200 200"
        width="100%"
        style={{ display: 'block', maxWidth: 200, margin: '0 auto' }}
      >
        {segments.map(seg => (
          <circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={20}
            strokeLinecap="round"
            strokeDasharray={`${seg.arc} ${circumference - seg.arc}`}
            strokeDashoffset={seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedTier(prev => prev === seg.label ? null : seg.label)}
          />
        ))}
        <circle cx={cx} cy={cy} r={55} fill="white" />
        {segments.map(seg => {
          const pct = Math.round((seg.count / total) * 100);
          const midArc =
            ((-seg.offset + seg.arc / 2) / circumference) * 2 * Math.PI -
            Math.PI / 2;
          const labelR = r;
          const lx = cx + labelR * Math.cos(midArc);
          const ly = cy + labelR * Math.sin(midArc);
          return (
            <text
              key={`lbl-${seg.label}`}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fontWeight={700}
              fill="#fff"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedTier(prev => prev === seg.label ? null : seg.label)}
            >
              {pct}%
            </text>
          );
        })}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill="#333"
        >
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#999">
          components
        </text>
      </svg>
      {selectedTier && (() => {
        const tier = COMPLETENESS_TIERS.find(t => t.label === selectedTier);
        if (!tier) return null;
        const filtered = components.filter(
          c => c.score >= tier.min && c.score < tier.max,
        );
        return (
          <>
            <div className={classes.previewHeader}>
              <Typography className={classes.previewTierLabel}>
                <span
                  className={classes.completenessLegendDot}
                  style={{ background: tier.color }}
                />
                {tier.label} &mdash; {filtered.length} component{filtered.length !== 1 ? 's' : ''}
              </Typography>
              <IconButton size="small" onClick={() => setSelectedTier(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <div className={classes.previewPanel}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Owner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.name}>
                      <TableCell>
                        <Link to={`/catalog/default/component/${c.name}`}>
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/catalog/default/group/${c.owner}`}>
                          {c.owner}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );
      })()}
      <div className={classes.completenessLegend}>
        {tierCounts.map(tier => (
          <span key={tier.label}>
            <span
              className={classes.completenessLegendDot}
              style={{ background: tier.color }}
            />
            {tier.label} ({tier.count})
          </span>
        ))}
      </div>
    </InfoCard>
  );
}

export function AdoptionInsightsPage() {
  const classes = useStyles();

  return (
    <Page themeId="tool">
      <Content>
        <div className={classes.headerRow}>
          <Typography className={classes.pageTitle}>
            Adoption Insights
          </Typography>
          <Select
            value="28"
            variant="outlined"
            size="small"
            className={classes.periodSelect}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="28">Last 28 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <InfoCard
              title={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <Typography variant="h6">Active users</Typography>
                  <span className={classes.exportLink}>
                    <GetAppIcon fontSize="small" />
                    Export CSV
                  </span>
                </div>
              }
            >
              <Typography className={classes.chartSummary}>
                Average peak active user count was <strong>187 per week</strong>{' '}
                for this period.
              </Typography>
              <ActiveUsersChart />
              <div className={classes.legend}>
                <span>
                  <span
                    className={classes.legendDot}
                    style={{ background: '#333' }}
                  />
                  Returning users
                </span>
                <span>
                  <span
                    className={classes.legendDot}
                    style={{ background: '#90caf9' }}
                  />
                  New users
                </span>
              </div>
            </InfoCard>
          </Grid>
          <Grid item xs={12} md={5}>
            <InfoCard title="Top 3 templates">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Executions</TableCell>
                    <TableCell align="right">Est. Time Saved</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TOP_TEMPLATES.map(t => (
                    <TableRow key={t.name}>
                      <TableCell>
                        <Link to="/create" className={classes.templateLink}>
                          {t.name}
                        </Link>
                      </TableCell>
                      <TableCell align="right">{t.executions}</TableCell>
                      <TableCell align="right">{t.timeSaved}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </InfoCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} style={{ marginTop: 0 }}>
          <Grid item xs={12} md={7}>
            <CompletenessScoreChart />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}
