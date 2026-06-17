/*
 * Copyright 2023 The Backstage Authors
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
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNotificationsApi } from '../../hooks';
import { SidebarItem } from '@backstage/core-components';
import {
  IconComponent,
  useApi,
  useApp,
  useRouteRef,
} from '@backstage/core-plugin-api';
import { toastApiRef } from '@backstage/frontend-plugin-api';
import { rootRouteRef } from '../../routes';
import { useSignal } from '@backstage/plugin-signals-react';
import {
  Notification,
  NotificationSeverity,
  NotificationSignal,
} from '@backstage/plugin-notifications-common';
import { useWebNotifications } from '../../hooks/useWebNotifications';
import { useTitleCounter } from '../../hooks/useTitleCounter';
import { notificationsApiRef } from '../../api';
import {
  closeSnackbar,
  enqueueSnackbar,
  MaterialDesignContent,
  OptionsWithExtraProps,
  SnackbarKey,
  SnackbarProvider,
  VariantType,
} from 'notistack';
import { SeverityIcon } from '../NotificationsTable/SeverityIcon';
import { ButtonIcon, Flex, Tag, TagGroup } from '@backstage/ui';
import {
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiNotification2Line,
} from '@remixicon/react';
import { Link } from 'react-router-dom';
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import MuiButton from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import styles from './NotificationsSideBarItem.module.css';

const usePopoverStyles = makeStyles(theme => ({
  popper: {
    zIndex: theme.zIndex.tooltip,
    marginLeft: theme.spacing(1),
  },
  paper: {
    width: 340,
    maxHeight: 380,
    overflow: 'auto',
    boxShadow: theme.shadows[8],
  },
  header: {
    padding: theme.spacing(1.5, 2),
    fontWeight: 600,
  },
  listItem: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  listIcon: {
    minWidth: 32,
    color: theme.palette.text.secondary,
  },
  title: {
    fontSize: '0.84rem',
    lineHeight: 1.4,
  },
  timestamp: {
    fontSize: '0.72rem',
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  empty: {
    padding: theme.spacing(3),
    textAlign: 'center' as const,
    color: theme.palette.text.secondary,
  },
}));

const NotificationsIcon: IconComponent = props => {
  let size = 24;
  if (props.fontSize === 'large') {
    size = 32;
  } else if (props.fontSize === 'small') {
    size = 16;
  }
  return <RiNotification2Line size={size} />;
};

const StyledMaterialDesignContent = forwardRef<HTMLDivElement, any>(
  (props: any, ref: React.Ref<HTMLDivElement>) => (
    <MaterialDesignContent
      {...props}
      ref={ref}
      className={[props.className, styles.snackbarContent]
        .filter(Boolean)
        .join(' ')}
    />
  ),
);

declare module 'notistack' {
  interface VariantOverrides {
    // Custom variants for the snackbar
    low: true;
    normal: true;
    high: true;
    critical: true;
  }
}

/**
 * @public
 */
export type NotificationSnackbarProperties = {
  enabled?: boolean;
  autoHideDuration?: number | null;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  dense?: boolean;
  maxSnack?: number;
  snackStyle?: React.CSSProperties;
  iconVariant?: Partial<Record<NotificationSeverity, React.ReactNode>>;
  Components?: {
    [key in NotificationSeverity]: React.JSXElementConstructor<any>;
  };
};

/**
 * Props passed to the custom renderItem function
 * @public
 */
export type NotificationsRenderItemProps = {
  /** Current unread notification count */
  unreadCount: number;
  /** Route path to the notifications page */
  to: string;
  /** Click handler that requests web notification permission */
  onClick: () => void;
};

/**
 * @public
 */
export type NotificationsSideBarItemProps = {
  webNotificationsEnabled?: boolean;
  titleCounterEnabled?: boolean;
  /**
   * @deprecated Use `snackbarProps` instead.
   */
  snackbarEnabled?: boolean;
  /**
   * @deprecated Use `snackbarProps` instead.
   */
  snackbarAutoHideDuration?: number | null;
  snackbarProps?: NotificationSnackbarProperties;
  className?: string;
  icon?: IconComponent;
  text?: string;
  disableHighlight?: boolean;
  noTrack?: boolean;
  /**
   * Optional render function to provide custom UI instead of the default SidebarItem.
   */
  renderItem?: (props: NotificationsRenderItemProps) => React.ReactNode;
};

/** @public */
export const NotificationsSidebarItem = (
  props?: NotificationsSideBarItemProps,
) => {
  const {
    webNotificationsEnabled = false,
    titleCounterEnabled = true,
    snackbarEnabled = true,
    snackbarAutoHideDuration = 15000,
    icon = NotificationsIcon,
    text = 'Notifications',
    ...restProps
  } = props ?? {
    webNotificationsEnabled: false,
    titleCounterEnabled: true,
    snackbarProps: {
      enabled: true,
      autoHideDuration: 15000,
    },
  };

  const snackbarProps = useMemo(
    () =>
      props?.snackbarProps ?? {
        enabled: snackbarEnabled,
        autoHideDuration: snackbarAutoHideDuration,
      },
    [props?.snackbarProps, snackbarAutoHideDuration, snackbarEnabled],
  );

  const { loading, error, value, retry } = useNotificationsApi(api =>
    api.getStatus(),
  );
  const notificationsApi = useApi(notificationsApiRef);
  const toastApi = useApi(toastApiRef);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRoute = useRouteRef(rootRouteRef)();
  const app = useApp();
  // TODO: Do we want to add long polling in case signals are not available
  const { lastSignal } = useSignal<NotificationSignal>('notifications');
  const { sendWebNotification, requestUserPermission } = useWebNotifications(
    webNotificationsEnabled,
  );
  const [refresh, setRefresh] = useState(false);
  const { setNotificationCount } = useTitleCounter();

  const getSnackbarProperties = useCallback(
    (notification: Notification) => {
      const action = (snackBarId: SnackbarKey) => (
        <Flex gap="1">
          <ButtonIcon
            aria-label="open notification"
            icon={<RiExternalLinkLine size={16} />}
            variant="secondary"
            onPress={() => {
              const link = notification.payload.link ?? notificationsRoute;
              window.open(link, '_blank', 'noopener,noreferrer');
              if (notification.payload.link) {
                notificationsApi
                  .updateNotifications({
                    ids: [notification.id],
                    read: true,
                  })
                  .catch(() => {
                    toastApi.post({
                      title: 'Failed to mark notification as read',
                      status: 'danger',
                    });
                  });
              }
              closeSnackbar(snackBarId);
            }}
          />
          <ButtonIcon
            aria-label="mark as read"
            icon={<RiCheckboxCircleLine size={16} />}
            variant="secondary"
            onPress={() => {
              notificationsApi
                .updateNotifications({
                  ids: [notification.id],
                  read: true,
                })
                .then(() => {
                  closeSnackbar(snackBarId);
                })
                .catch(() => {
                  toastApi.post({
                    title: 'Failed to mark notification as read',
                    status: 'danger',
                  });
                });
            }}
          />
        </Flex>
      );

      return { action };
    },
    [notificationsRoute, notificationsApi, toastApi],
  );

  useEffect(() => {
    if (refresh) {
      retry();
      setRefresh(false);
    }
  }, [refresh, retry]);

  useEffect(() => {
    const handleNotificationSignal = (signal: NotificationSignal) => {
      if (
        (!webNotificationsEnabled && !snackbarProps.enabled) ||
        signal.action !== 'new_notification'
      ) {
        return;
      }
      notificationsApi
        .getNotification(signal.notification_id)
        .then(notification => {
          if (!notification) {
            return;
          }
          if (webNotificationsEnabled) {
            sendWebNotification({
              id: notification.id,
              title: notification.payload.title,
              description: notification.payload.description ?? '',
              link: notification.payload.link,
            });
          }
          if (snackbarProps.enabled) {
            const { action } = getSnackbarProperties(notification);
            const snackBarText =
              notification.payload.title.length > 50
                ? `${notification.payload.title.substring(0, 50)}...`
                : notification.payload.title;
            enqueueSnackbar(snackBarText, {
              key: notification.id,
              style: snackbarProps.snackStyle,
              variant: notification.payload.severity,
              anchorOrigin: snackbarProps.anchorOrigin ?? {
                vertical: 'bottom',
                horizontal: 'right',
              },
              action,
              autoHideDuration: snackbarProps.autoHideDuration,
            } as OptionsWithExtraProps<VariantType>);
          }
        })
        .catch(() => {
          toastApi.post({
            title: 'Failed to fetch notification',
            status: 'danger',
          });
        });
    };

    if (lastSignal && lastSignal.action) {
      handleNotificationSignal(lastSignal);
      setRefresh(true);
    }
  }, [
    lastSignal,
    sendWebNotification,
    webNotificationsEnabled,
    notificationsApi,
    toastApi,
    getSnackbarProperties,
    snackbarProps,
  ]);

  useEffect(() => {
    if (!loading && !error && value) {
      setUnreadCount(value.unread);
    }
  }, [loading, error, value]);

  useEffect(() => {
    if (titleCounterEnabled) {
      setNotificationCount(unreadCount);
    }
  }, [titleCounterEnabled, unreadCount, setNotificationCount]);

  const count = !error && !!unreadCount ? unreadCount : undefined;

  const handleClick = useCallback(() => {
    requestUserPermission();
  }, [requestUserPermission]);

  // Props to pass to custom renderItem function
  const renderItemProps: NotificationsRenderItemProps = useMemo(
    () => ({
      unreadCount,
      to: notificationsRoute,
      onClick: handleClick,
    }),
    [unreadCount, notificationsRoute, handleClick],
  );

  const popoverClasses = usePopoverStyles();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [recentNotifications, setRecentNotifications] = useState<
    Notification[]
  >([]);

  const fetchRecent = useCallback(() => {
    notificationsApi
      .getNotifications({ limit: 5 })
      .then(res => {
        const items = (res as any).notifications ?? [];
        setRecentNotifications(items);
      })
      .catch(() => {});
  }, [notificationsApi]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent, unreadCount]);

  const closeTimeout = useRef<ReturnType<typeof setTimeout>>();

  const cancelClose = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = undefined;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    cancelClose();
    closeTimeout.current = setTimeout(() => setPopoverOpen(false), 200);
  }, [cancelClose]);

  const handleMouseEnter = useCallback(() => {
    cancelClose();
    hoverTimeout.current = setTimeout(() => {
      fetchRecent();
      setPopoverOpen(true);
    }, 250);
  }, [fetchRecent, cancelClose]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    scheduleClose();
  }, [scheduleClose]);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <>
      {snackbarEnabled && (
        <SnackbarProvider
          iconVariant={{
            normal: snackbarProps?.iconVariant?.normal ?? (
              <SeverityIcon severity="normal" className={styles.snackbarIcon} />
            ),
            critical: snackbarProps?.iconVariant?.critical ?? (
              <SeverityIcon
                severity="critical"
                className={styles.snackbarIcon}
              />
            ),
            high: snackbarProps?.iconVariant?.high ?? (
              <SeverityIcon severity="high" className={styles.snackbarIcon} />
            ),
            low: snackbarProps?.iconVariant?.low ?? (
              <SeverityIcon severity="low" className={styles.snackbarIcon} />
            ),
          }}
          dense={snackbarProps?.dense}
          maxSnack={snackbarProps?.maxSnack}
          Components={{
            normal:
              snackbarProps?.Components?.normal ?? StyledMaterialDesignContent,
            critical:
              snackbarProps?.Components?.critical ??
              StyledMaterialDesignContent,
            high:
              snackbarProps?.Components?.high ?? StyledMaterialDesignContent,
            low: snackbarProps?.Components?.low ?? StyledMaterialDesignContent,
          }}
        />
      )}
      <div
        ref={anchorRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {props?.renderItem ? (
          props.renderItem(renderItemProps)
        ) : (
          <SidebarItem
            to={notificationsRoute}
            onClick={handleClick}
            text={text}
            icon={icon}
            {...restProps}
          >
            {count && (
              <TagGroup aria-label="Unread notifications">
                <Tag size="small">{count > 99 ? '99+' : count}</Tag>
              </TagGroup>
            )}
          </SidebarItem>
        )}
      </div>
      <Popper
        open={popoverOpen}
        anchorEl={anchorRef.current}
        placement="right"
        className={popoverClasses.popper}
      >
        <ClickAwayListener onClickAway={() => setPopoverOpen(false)}>
          <Paper
            className={popoverClasses.paper}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <Typography className={popoverClasses.header} variant="subtitle2">
              Recent Notifications
            </Typography>
            <Divider />
            {recentNotifications.length === 0 ? (
              <Typography className={popoverClasses.empty} variant="body2">
                No notifications
              </Typography>
            ) : (
              <List disablePadding>
                {recentNotifications.map(n => {
                  const BadgeIcon = app.getSystemIcon(
                    n.payload.icon ?? 'notification',
                  );
                  return (
                    <ListItem
                      key={n.id}
                      className={popoverClasses.listItem}
                      divider
                      component={Link}
                      to={notificationsRoute}
                      onClick={() => setPopoverOpen(false)}
                    >
                      {BadgeIcon && (
                        <ListItemIcon className={popoverClasses.listIcon}>
                          <BadgeIcon fontSize="small" />
                        </ListItemIcon>
                      )}
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography className={popoverClasses.title}>
                            {n.payload.title}
                            {n.payload.link && (
                              <MuiButton
                                component={Link}
                                to={n.payload.link}
                                onClick={() => setPopoverOpen(false)}
                                variant="outlined"
                                size="small"
                                style={{
                                  marginTop: 2,
                                  marginLeft: 4,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.6rem',
                                  borderColor: 'rgba(0,0,0,0.25)',
                                  color: '#000',
                                  display: 'inline-block',
                                  width: 'auto',
                                  padding: '1px 8px',
                                  minHeight: 0,
                                  lineHeight: 1.5,
                                }}
                              >
                                View Insights →
                              </MuiButton>
                            )}
                          </Typography>
                        }
                        secondary={
                          <Typography className={popoverClasses.timestamp}>
                            {formatTime(n.created)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};
