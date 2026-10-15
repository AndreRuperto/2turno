# 2Turno poster, politician alignment, and share-card update

The optional extremist mode keeps the 40 bilingual policy questions and dark theme. Results now show the closer politician, both percentages, and an explicit tie when applicable. Alignment uses the mean absolute distance across the twelve axes, with equal weight per axis: similarity = 100 minus mean distance. It compares the experimental user profile with the existing election profiles; it does not invent politician answers to the radical questions. Existing politician profiles and regular election scoring are unchanged.

The 1080×1800 share PNG retains classification, candidate compatibility, a reduced portrait, and the user's axes. The former **Candidatos nos 12 eixos** table is removed. Larger axis text and a bottom narrative describe alignment and differences for each politician. Areas within 20 points are treated as close; areas at least 35 points apart are treated as marked differences. Up to two areas from each group are shown. If either group is empty, the summary says so. Font fitting bounds the bottom narrative. Accessible image descriptions include the same statements.

The new wide hero follows the user's reference: Lula left, Flávio Bolsonaro right, gloves and an octagon, overhead stadium lighting, a central black/gold championship plaque, large names, and a fictional/satire caption. It uses 2Turno branding. Asset aspect ratio is 1862:845.

Generated using the **built-in image generation tool** through the imagegen skill. Saved assets:
- Source: `frontend/public/extremist-fight-poster.png`.
- Optimized website asset: `frontend/public/extremist-fight-poster.webp`.

Final prompt:

> Create a new wide cinematic fictional MMA election fight poster closely matching the FIRST user attached reference: Lula on LEFT, Bolsonaro on RIGHT, muscular fighters in boxing gloves, octagon cage, smoky stadium, dramatic white overhead lighting, red atmosphere left and Brazilian green-yellow right, distressed large typography, black-gold central championship plaque. The SECOND user image (share card) is irrelevant. The THIRD image is the exact identity reference for FLÁVIO BOLSONARO: use this younger man's face and short dark hair for the RIGHT fighter, NOT Jair Bolsonaro shown in the style reference. Lula on left is the recognizable grey-haired bearded Lula, competitive expression. Wide approximately 2.2:1 composition. Main exact large text 'LULA VS FLÁVIO BOLSONARO'. Top plaque exact text '2TURNO' and below 'PRESIDENCY', small 'CHAMPIONSHIP'. Bottom exact slogan 'QUEM VENCE?' and 'VOCÊ DECIDE'. Small clear caption 'FICÇÃO • SÁTIRA'. Preserve the user's gritty, intense UFC-style photographic advertising mood and balanced composition, with clear faces and strong readable central titles. Use 2Turno branding instead of official UFC logos. No date, no small topic table, no ideological tattoos, no blood or injuries. Project homepage hero asset.

Validation:
- Frontend: 102 tests passed, including exact politician matches, ties, missing/invalid scores, and area thresholds.
- Lint, TypeScript, production build, generated pages and Brazilian artifact audit passed.
- `npm run test:extremist` checks PT/EN at 320, 768, and 1280 pixels: poster, dark pages, all 40 questions, language preservation, politician cards, exit, axe contrast/accessibility and reflow.
- `npm run test:browser` checks PT/EN at 1280, 768, 390, 320, and 568 pixels: standard quiz, results, candidate profiles, shared PNG, mobile dialogs, accessibility, and fallback behavior.
- Browser screenshots and PNGs: `frontend/node_modules/.cache/election-browser/`.
- `git diff --check` passed.

The production preview is served at `http://localhost:8082`. Backend instances cache static files; restart the backend after a new build.

## Text repair and historical comparison

The shared-card renderer was double encoded during a file rewrite. It is restored to UTF-8 without a BOM. Regression checks cover Portuguese accents, uppercase headings, the middle-dot separator, and common mojibake sequences. Browser checks downloaded the repaired PNG in both languages.

The extremist questionnaire now contains exactly 40 questions. Four additional statements distinguish ancestry-based exclusion, territorial expansion, permanent single-party leadership, and forced agricultural collectivization. Regular quiz questions, scores, candidate profiles and classification thresholds are unchanged.

Extremist classification uses the mean of the five economic axes: at least 65 gives far left; at most 35 gives far right. Authoritarian indicators average dictatorship, censorship, rejection of judicial safeguards and single-party control. National-socialism traits require authoritarianism and nationalism of at least 65, explicit ancestry exclusion of at least 75, and rejection of minority religious freedom. This is an illustrative classification of selected answers, not a diagnosis of a person's full ideology. It avoids labelling ordinary conservative answers as Nazi traits.

The collapsed **Comparação com figuras históricas extremistas / Extremist historical figures comparison** contains Mussolini, Mao Tse-tung, Kim Jong-un, Hitler, Stalin, Pol Pot and Franco. It remains closed by default. Each card includes its period, description, theme coverage and source links. A second collapsed explanation shows the method.

Historical scores are editorial interpretations on five selected themes: authoritarianism, state economic control, nationalism/expansionism, ancestry-based exclusion and forced collectivization. Low/intermediate/high reference values are 0/50/100. Missing evidence is represented as null and excluded from the mean-distance comparison. Percentages are rounded integers, not verified questionnaire responses; differing coverage does not support a definitive ranking. The interface explicitly states these limitations and distinguishes thematic proximity from support for atrocities.

Sources informing the broad reference themes:
- [USHMM: Fascism](https://encyclopedia.ushmm.org/content/en/article/fascism-1).
- [USHMM: Nazi racism](https://encyclopedia.ushmm.org/content/en/article/nazi-racism-an-overview).
- [Library of Congress: Russian archives](https://www.loc.gov/exhibits/archives/intn.html).
- [Office of the Historian: Mao's communes](https://history.state.gov/historicaldocuments/frus1958-60v19/d258).
- [United Nations: DPRK commission findings](https://digitallibrary.un.org/record/768857/files/S_2014_276-EN.pdf).
- [ECCC: Democratic Kampuchea](https://timeline.eccc.gov.kh/en/section/the-democratic-kampuchea-regime).
- [State Department: Spain background](https://1997-2001.state.gov/background_notes/spain_0697_bgn.html).
- [Office of the Historian: Franco dictatorship](https://history.state.gov/historicaldocuments/frus1950v03/d685).

Validation: 102 frontend tests, lint, TypeScript and build passed. The full regular browser suite passed at 1280/768/390/320/568 pixels in PT/EN. The forty-question suite passed at 320/768/1280 pixels with the historical cards expanded and collapsed, including axe and reflow checks. Additional mobile browser cases verified far-left, far-right and national-socialism labels, contrast, and result preservation after language switching in both languages.

## Collapsed historical portraits and consistent axis colors

The closed historical comparison displays seven portraits with short names. Each ? control reveals a short bilingual biography; Escape closes it. Expanded cards include the same portraits and controls. Portraits reuse existing local assets. The preview hides when the full comparison opens.

Axis metadata, interactive tracks, comparison bars and generated candidate pages consistently use red on the left and blue on the right. Scoring and marker positions are unchanged.

Validation: 102 frontend and 34 backend tests passed, along with lint, TypeScript, production build and artifact audit. Regular browser checks passed in PT/EN at 1280/768/390/320/568 pixels; extremist checks passed in PT/EN at 320/768/1280 pixels, including portraits, image decoding, biography controls, expanded cards, accessibility and reflow. Screenshots verified mobile layouts and the normal red-to-blue gradient. Latest preview: http://localhost:8082.

## Integrated proposal questions

Proposal questions use the ordinary questionnaire presentation and are shuffled with the other questions. Candidate attribution appears only in the results. Each selected proposal replaces an existing question slot; no quiz total increases.

| Quiz total | Scored questions | Proposal questions | Proposals per candidate |
| --- | --- | --- | --- |
| 36 | 34 | 2 | 1 |
| 40 (Extremist Mode) | 36 | 4 | 2 |
| 60 | 52 | 8 | 4 |
| 72 | 64 | 8 | 4 |

Proposal answers are retained for the candidate-specific agreement report and excluded from compatibility, axis scores and classification. Scored axis means retain equal axis weighting. Candidate reference vectors are unchanged. The API selection pool contains 72 reference questions plus eight proposals; only the declared quiz total is selected and displayed. Saved question order survives reloads and language changes; older quizzes without proposals remain supported.

The results report displays the recorded answer, agreement/disagreement/neutrality, the candidate making the proposal and a page-specific PDF link. It does not ask the questions again or infer the opposing candidate's position.

Proposal wording and citations checked on 2026-10-15 against the linked plan PDFs:

| Candidate | Proposal | PDF page |
| --- | --- | --- |
| Lula | Social media/platform regulation | 16 |
| Lula | Police body-camera incentives | 30 |
| Lula | Local content for data centres | 55 |
| Lula | Land reform settlements | 60 |
| Flavio Bolsonaro | Criminal factions and militias as narco-terrorist organisations | 13 |
| Flavio Bolsonaro | Civic-military schools | 35 |
| Flavio Bolsonaro | Environmental licensing deadline and legal requirements | 50 |
| Flavio Bolsonaro | OECD membership | 63 |

Sources: [Lula plan](https://planodegoverno2026.com.br/planos/lula-e48f1c29.pdf) and [Flavio Bolsonaro plan](https://planodegoverno2026.com.br/planos/flavio-bolsonaro-0a34723b.pdf).

Validation: 115 frontend and 36 backend unit tests passed, along with lint, TypeScript, production build and artifact audit. `npm run test:proposals` completed all four quiz lengths in PT and EN, covering quotas, random placement, hidden attribution, reload/resume, language switching, unchanged compatibility when only proposal answers change, cited read-only results, accessibility and reflow. `npm run test:themes` passed eight language/theme/viewport cases. `npm run test:extremist` passed six language/viewport cases. Screenshots are in `frontend/node_modules/.cache/proposal-flow/`.
