/*
 * Copyright 2022 The Backstage Authors
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
import { Content, Header, Page } from '@backstage/core-components';

import { TemplateEditorIntro } from './TemplateEditorIntro';
import { useNavigate } from 'react-router-dom';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  rootRouteRef,
  editorRouteRef,
  templateFormRouteRef,
  customFieldsRouteRef,
} from '../../../routes';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { scaffolderTranslationRef } from '../../../translation';
import { useTemplateDirectory } from './useTemplateDirectory';
import { TimeSavedDialog } from './TimeSavedDialog';

export function TemplateIntroPage() {
  const navigate = useNavigate();
  const createLink = useRouteRef(rootRouteRef);
  const editorLink = useRouteRef(editorRouteRef);
  const templateFormLink = useRouteRef(templateFormRouteRef);
  const customFieldsLink = useRouteRef(customFieldsRouteRef);
  const { t } = useTranslationRef(scaffolderTranslationRef);
  const { openDirectory, createDirectory } = useTemplateDirectory();
  const [timeSavedOpen, setTimeSavedOpen] = useState(false);

  const handleSelect = useCallback(
    (option: 'create-template' | 'local' | 'form' | 'field-explorer') => {
      if (option === 'local') {
        openDirectory()
          .then(() => navigate(editorLink()))
          .catch(() => {});
      } else if (option === 'create-template') {
        setTimeSavedOpen(true);
      } else if (option === 'form') {
        navigate(templateFormLink());
      } else if (option === 'field-explorer') {
        navigate(customFieldsLink());
      }
    },
    [openDirectory, navigate, editorLink, templateFormLink, customFieldsLink],
  );

  const handleTimeSavedConfirm = useCallback(
    (timeSaved: string) => {
      setTimeSavedOpen(false);
      createDirectory({ timeSaved })
        .then(() => navigate(editorLink()))
        .catch(() => {});
    },
    [createDirectory, navigate, editorLink],
  );

  const handleTimeSavedCancel = useCallback(() => {
    setTimeSavedOpen(false);
  }, []);

  return (
    <Page themeId="home">
      <Header
        title={t('templateIntroPage.title')}
        type="Scaffolder"
        typeLink={createLink()}
        subtitle={t('templateIntroPage.subtitle')}
      />
      <Content>
        <TemplateEditorIntro onSelect={handleSelect} />
        <TimeSavedDialog
          open={timeSavedOpen}
          onConfirm={handleTimeSavedConfirm}
          onCancel={handleTimeSavedCancel}
        />
      </Content>
    </Page>
  );
}
