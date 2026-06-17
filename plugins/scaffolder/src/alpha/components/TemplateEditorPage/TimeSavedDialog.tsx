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

import { useCallback, useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

const TIME_UNITS = ['minutes', 'hours', 'days', 'weeks'] as const;
type TimeUnit = (typeof TIME_UNITS)[number];

const useStyles = makeStyles(theme => ({
  fields: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'flex-end',
    marginTop: theme.spacing(1),
  },
  valueField: {
    width: 120,
  },
  unitField: {
    minWidth: 140,
  },
}));

interface TimeSavedDialogProps {
  open: boolean;
  onConfirm: (timeSaved: string) => void;
  onCancel: () => void;
}

export function TimeSavedDialog(props: TimeSavedDialogProps) {
  const { open, onConfirm, onCancel } = props;
  const classes = useStyles();
  const [value, setValue] = useState<string>('');
  const [unit, setUnit] = useState<TimeUnit>('hours');

  const isValid =
    value !== '' && Number.isInteger(Number(value)) && Number(value) > 0;

  const handleConfirm = useCallback(() => {
    if (!isValid) return;
    const label = Number(value) === 1 ? unit.replace(/s$/, '') : unit;
    onConfirm(`${value} ${label}`);
    setValue('');
    setUnit('hours');
  }, [value, unit, isValid, onConfirm]);

  const handleCancel = useCallback(() => {
    setValue('');
    setUnit('hours');
    onCancel();
  }, [onCancel]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="time-saved-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="time-saved-dialog-title">
        Estimated Time Saved
      </DialogTitle>
      <DialogContent>
        <div className={classes.fields}>
          <TextField
            className={classes.valueField}
            label="Amount"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            value={value}
            onChange={e => setValue(e.target.value)}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <FormControl className={classes.unitField}>
            <InputLabel id="time-unit-label">Unit</InputLabel>
            <Select
              labelId="time-unit-label"
              value={unit}
              onChange={e => setUnit(e.target.value as TimeUnit)}
            >
              {TIME_UNITS.map(u => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="default">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" disabled={!isValid}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
