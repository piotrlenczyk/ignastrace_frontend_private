# Icon substitutions

Every icon is now rendered through a single component:

```tsx
import { Icon } from '@/components/ui/icon';

<Icon name="search" className="size-5 text-text-brand-primary" />;
```

`name` is typed as `IconName`, a union generated from `src/components/ui/icon/svgs/`
(`svgs/add-file.svg` → `name="add-file"`). The lookup table lives in the generated
`src/components/ui/icon/icons/index.ts`; adding an SVG and running
`npm run generate:icons` is all it takes to make a new name available.

## Names that no longer exist

The icon set was replaced before this refactor, and 103 of the 113 icons the
screens referenced were dropped in that swap — those imports had been failing to
compile ever since. Each of them now points at the closest icon that does exist,
so the code type-checks and renders, but the picks below are stand-ins, not
design decisions. When the missing icons are re-exported from Figma, these are
the call sites to revisit.

| Referenced icon               | Rendered instead    |
| ----------------------------- | ------------------- |
| `IconAlarm`                   | `timer`             |
| `IconAlertTriangle`           | `alert-circle`      |
| `IconAlertTriangleLine`       | `alert-circle`      |
| `IconAnnotationText`          | `chat`              |
| `IconCalendarDate`            | `calendar`          |
| `IconCalendarDates`           | `calendar`          |
| `IconCaretDown`               | `arrow-down`        |
| `IconCellTower`               | `mobile-protection` |
| `IconChartBarDown`            | `bar-chart`         |
| `IconChatBubbleDotsLine`      | `chat`              |
| `IconCheck`                   | `tick`              |
| `IconCheckCircleAlt03`        | `check-circle`      |
| `IconCheckCircleLine`         | `check-circle`      |
| `IconCheckStar`               | `checkmark-badge`   |
| `IconChevronRightSmall`       | `arrow-right`       |
| `IconClipboardList`           | `list-check`        |
| `IconCnn`                     | `globe`             |
| `IconComponentCard`           | `identification`    |
| `IconCopyLine`                | `copy`              |
| `IconEmail`                   | `mail`              |
| `IconEmailLine`               | `mail`              |
| `IconEnterpriseLine`          | `building`          |
| `IconEye`                     | `view`              |
| `IconEyeScan`                 | `scan`              |
| `IconFaceHappyLine`           | `user`              |
| `IconFaceSmile`               | `user`              |
| `IconFlagLine`                | `globe`             |
| `IconForbes`                  | `globe`             |
| `IconFox`                     | `globe`             |
| `IconGender`                  | `female`            |
| `IconGlobeAlt`                | `globe`             |
| `IconGlobeLine`               | `globe`             |
| `IconGoogleBrand`             | `globe`             |
| `IconGridAlt`                 | `menu-square`       |
| `IconInbox`                   | `mail-account`      |
| `IconInfoCircleLine`          | `info`              |
| `IconLinkAlt01`               | `link`              |
| `IconLinkAlt02`               | `link`              |
| `IconLinkExternal`            | `open`              |
| `IconLoaderCircle`            | `reload`            |
| `IconLocationMy`              | `location`          |
| `IconLocationPinCancelLine`   | `pin-location`      |
| `IconLocationPinCheck`        | `pin-location`      |
| `IconLocationPinLine`         | `pin-location`      |
| `IconLock`                    | `safe`              |
| `IconLockLine`                | `safe`              |
| `IconLockOpenLine`            | `unlock`            |
| `IconLogOut`                  | `logout`            |
| `IconNotificationLine`        | `alert-circle`      |
| `IconNotificationRingingLine` | `alert-circle`      |
| `IconNumber1`                 | `star-circle`       |
| `IconNumber2`                 | `star-circle`       |
| `IconNumber3`                 | `star-circle`       |
| `IconNumber4`                 | `star-circle`       |
| `IconNumber5`                 | `star-circle`       |
| `IconOpenEternalLink`         | `open`              |
| `IconPaintBrush`              | `edit`              |
| `IconPhone2Line`              | `phone`             |
| `IconPhoneLine`               | `phone`             |
| `IconRadarAlt`                | `scan`              |
| `IconRefresh`                 | `reload`            |
| `IconRefreshCw`               | `reload`            |
| `IconSendLine`                | `send`              |
| `IconSettingsAltLine`         | `setting`           |
| `IconSexOffender`             | `handcuffs`         |
| `IconShieldAlert`             | `shield`            |
| `IconShieldCheck`             | `shield`            |
| `IconShieldCheckLine`         | `shield`            |
| `IconSocialBehance`           | `globe`             |
| `IconSocialFacebook`          | `globe`             |
| `IconSocialGithub`            | `globe`             |
| `IconSocialGitlab`            | `globe`             |
| `IconSocialInstagram`         | `globe`             |
| `IconSocialKick`              | `globe`             |
| `IconSocialPinterest`         | `globe`             |
| `IconSocialReddit`            | `globe`             |
| `IconSocialSnapchat`          | `globe`             |
| `IconSocialTelegram`          | `globe`             |
| `IconSocialThreads`           | `globe`             |
| `IconSocialTiktok`            | `globe`             |
| `IconSocialTumblr`            | `globe`             |
| `IconSocialTwitch`            | `globe`             |
| `IconSocialWhatsapp`          | `globe`             |
| `IconSocialX`                 | `globe`             |
| `IconSocialYoutube`           | `globe`             |
| `IconSparksAltLine`           | `ai`                |
| `IconStarFilled`              | `star`              |
| `IconStarLine`                | `star`              |
| `IconStart`                   | `start-up`          |
| `IconSupportLine`             | `customer-support`  |
| `IconTagLine`                 | `discount`          |
| `IconThumbsUpLine`            | `favourite`         |
| `IconTimeRefresh`             | `timer`             |
| `IconTrashLine`               | `delete`            |
| `IconTrashLineAlt`            | `delete`            |
| `IconUsaToday`                | `globe`             |
| `IconUserAlert`               | `user`              |
| `IconUserCircle`              | `user-account`      |
| `IconUsers`                   | `user-group`        |
| `IconUsersGroup`              | `user-group`        |
| `IconWallet`                  | `credit-card`       |
| `IconWarningLine`             | `alert-circle`      |
| `IconXOctagon`                | `cancel`            |
