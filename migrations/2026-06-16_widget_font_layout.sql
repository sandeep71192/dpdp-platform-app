-- Adds typography + layout customisation to published widget configs.
-- Run once in the Supabase SQL editor (Project → SQL Editor → New query).
--   font_family: a CSS font stack, or 'inherit' to match the host page (default).
--   layout:      'card' (floating corner card, default), 'bar' (full-width bottom bar),
--                or 'pill' (compact badge that expands on click).
--   hero_image:  optional URL of a brand-uploaded hero image for the card layout.
--                When empty, the widget renders a brand-tinted procedural SVG instead.
alter table widget_configs
  add column if not exists font_family text not null default 'inherit',
  add column if not exists layout      text not null default 'card',
  add column if not exists hero_image  text;

-- New default brand colour (teal) for widgets with no detected colour.
alter table widget_configs alter column primary_color set default '#01A390';
