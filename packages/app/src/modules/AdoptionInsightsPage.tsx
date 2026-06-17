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

import { Content, InfoCard, Page } from '@backstage/core-components';
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
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Link } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core/styles';

const CHART_DATA = [
  { label: 'May 11, 2026', returning: 110, new: 18 },
  { label: 'May 18, 2026', returning: 130, new: 25 },
  { label: 'May 25, 2026', returning: 170, new: 30 },
  { label: 'Jun 1, 2026', returning: 195, new: 35 },
  { label: 'Jun 8, 2026', returning: 160, new: 28 },
];

const TOP_TEMPLATES = [
  { name: 'Create React App Template', executions: 11 },
  { name: 'Documentation Template', executions: 10 },
  { name: 'Spring Boot gRPC Service', executions: 2 },
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
            <Grid container spacing={3} direction="column">
              <Grid item>
                <InfoCard
                  title={
                    <div className={classes.timeSavedHeader}>
                      <Typography variant="h6">
                        Total estimated time saved
                      </Typography>
                      <Tooltip title="Estimated based on template time-saved annotations">
                        <IconButton size="small">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  }
                >
                  <Select
                    value="all"
                    variant="outlined"
                    size="small"
                    className={classes.teamSelect}
                    fullWidth
                  >
                    <MenuItem value="all">All teams</MenuItem>
                    <MenuItem value="platform">Platform</MenuItem>
                    <MenuItem value="frontend">Frontend</MenuItem>
                  </Select>
                  <div className={classes.metricGrid}>
                    <div style={{ gridColumn: 1, gridRow: 1 }} />
                    <Typography className={classes.metricFromLabel}>
                      from
                    </Typography>
                    <Typography
                      className={classes.metricValue}
                      style={{ gridColumn: 1, gridRow: 2 }}
                    >
                      10 <span className={classes.metricUnit}>days</span> 12{' '}
                      <span className={classes.metricUnit}>hours</span>
                    </Typography>
                    <Typography
                      className={classes.metricValue}
                      style={{ gridColumn: 2, gridRow: 2 }}
                    >
                      36
                    </Typography>
                    <Typography
                      className={classes.metricLabel}
                      style={{ gridColumn: 1, gridRow: 3 }}
                    >
                      estimated time saved
                    </Typography>
                    <Typography
                      className={classes.metricLabel}
                      style={{ gridColumn: 2, gridRow: 3 }}
                    >
                      self-service actions
                    </Typography>
                  </div>
                </InfoCard>
              </Grid>

              <Grid item>
                <InfoCard title="Top 3 templates">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Executions</TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </InfoCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
}
