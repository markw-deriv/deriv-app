// Things to do before touching this file :P
// 1- Please read https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
// 2- Please read RawMarker.jsx in https://github.com/binary-com/SmartCharts
// 3- Please read contract-store.js & trade.jsx carefully
import React          from 'react';
import { FastMarker, RawMarker } from 'smartcharts-beta';
import * as ICONS from './icons';

const RawMarkerMaker = (draw_callback) => {
    const Marker = ({ epoch_array, price_array, ...rest }) => (
        <RawMarker
            epoch_array={epoch_array}
            price_array={price_array}
            draw_callback={args => draw_callback({ ...args, ...rest })}
        />
    );
    return Marker;
};

export const FastMarkerMaker = children => {
    const Marker = ({ epoch, price, calculate_price, draw_callback, ...rest }) => {
        const onRef = ref => {
            if (ref) {
                ref.setPosition({ epoch, price, calculate_price, draw_callback });
            }
        };
        return (
            <FastMarker markerRef={onRef}>
                {children(rest)}
            </FastMarker>
        );
    };
    return Marker;
};

function get_color({ status, profit }) {
    const colors = {
        open: '#2196F3',
        won : '#2D9F93',
        lost: '#EC3F3F',
        sold: '#2196F3',
    };
    let color = colors[status || 'open'];
    if (status === 'open' && profit) {
        color = colors[profit > 0 ? 'won' : 'lost'];
    }
    return color;
}

const calc_scale = (zoom) => {
    return zoom ? Math.max(Math.min(Math.sqrt(zoom / 8), 1),  0.5) : 1;
};

/** @param {CanvasRenderingContext2D} ctx */
const draw_path = (ctx, { zoom, top, left, icon }) => {
    ctx.save();
    const scale = calc_scale(zoom);

    ctx.translate(
        left - icon.width * scale / 2,
        top - icon.height * scale / 2 ,
    );

    ctx.scale(scale, scale);

    icon.paths.forEach(({ points, fill, stroke }) => {
        if (fill) { ctx.fillStyle = fill; }
        if (stroke) { ctx.strokeStyle = stroke; }
        ctx.beginPath();
        let prev_x, prev_y;
        for (let idx = 0; idx < points.length; idx++) {
            let x, y, cx1, cx2, cy1, cy2;
            if (points[idx] === 'M') {
                x = points[++idx];
                y = points[++idx];
                ctx.moveTo(x, y);
            } else if (points[idx] === 'L') {
                x = points[++idx];
                y = points[++idx];
                ctx.lineTo(x, y);
            } else if (points[idx] === 'V') {
                y = points[++idx];
                ctx.lineTo(prev_x, y);
            } else if (points[idx] === 'H') {
                x = points[++idx];
                ctx.lineTo(x, prev_y);
            } else if (points[idx] === 'Q') {
                cx1 = points[++idx];
                cy1 = points[++idx];
                x = points[++idx];
                y = points[++idx];
                ctx.quadraticCurveTo(cx1, cy1, x, y);
            } else if (points[idx] === 'C') {
                cx1 = points[++idx];
                cy1 = points[++idx];
                cx2 = points[++idx];
                cy2 = points[++idx];
                x = points[++idx];
                y = points[++idx];
                ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
            }
            prev_x = x;
            prev_y = y;
        }
        ctx.closePath();
        if (fill) { ctx.fill(); }
        if (stroke) { ctx.stroke(); }
    });

    ctx.restore();
};

const render_label = ({ ctx, text, tick: { zoom, left, top } }) => {
    const scale = calc_scale(zoom);
    const size = Math.floor(scale * 3 + 7);
    ctx.font = `${size}px Roboto`;
    text.split(/\n/).forEach((line, idx) => {
        const w = Math.ceil(ctx.measureText(line).width);
        ctx.fillText(line, left - 5 - w , top + idx * size + 1);
    });
};

const TickContract = RawMarkerMaker(({
    ctx: context,
    points: [start, ...ticks],
    prices: [barrier], // TODO: support two barrier contracts
    is_last_contract,
    contract_info: {
        contract_type,
        exit_tick_time,
        status,
        profit,
        is_sold,
        tick_stream,
        tick_count,
    },
}) => {
    /** @type {CanvasRenderingContext2D} */
    const ctx = context;

    const color = get_color({
        status,
        profit: (tick_stream || []).length > 1 ? profit : null,
    });

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    const draw_start_line = is_last_contract && start.visible && !is_sold;

    if (draw_start_line) {
        render_label({
            ctx,
            text: 'Start\nTime',
            tick: { ...start, top: 100 },
        });
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(start.left, 0);
        ctx.lineTo(start.left, ctx.canvas.height);
        ctx.stroke();
    }

    if (!ticks.length || !barrier) {
        ctx.restore();
        return;
    }
    const entry = ticks[0];
    const expiry = ticks[ticks.length - 1];
    // vertical line connecting date start to barrier
    if (!draw_start_line && barrier && entry && start.visible && barrier !== entry.top) {
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(start.left, barrier);
        ctx.lineTo(start.left, entry.top);
        ctx.stroke();
    }

    // barrier line
    if (start.visible || entry.visible || expiry.visible) {
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(start.left, barrier);
        ctx.lineTo(entry.left, barrier);
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(entry.left, barrier);
        ctx.lineTo(expiry.left, barrier);
        ctx.stroke();
    }
    const scale = calc_scale(entry.zoom);
    // remaining ticks
    if (expiry.visible && !is_sold) {
        for (let i = 0; i <= (tick_count - ticks.length + 1); ++i) {
            const left = expiry.left + 8 * i * scale;
            if (left < entry.max_left) {
                ctx.beginPath();
                ctx.arc(left, barrier, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    // start-time marker
    if (start.visible) {
        draw_path(ctx, {
            top : entry.top,
            left: start.left,
            zoom: start.zoom,
            icon: ICONS[contract_type].with_color(color),
        });
    }
    // date expiry marker
    if (
        expiry.visible &&
        expiry.epoch * 1 === exit_tick_time * 1 &&
        status !== 'open'
    ) {
        draw_path(ctx, {
            top : barrier,
            left: expiry.left,
            zoom: expiry.zoom,
            icon: ICONS[status.toUpperCase()],
        });
    }
    ctx.restore();
});

const NonTickContract = RawMarkerMaker(({
    ctx: context,
    points: [start, expiry, entry],
    is_last_contract,
    prices: [barrier], // TODO: support two barrier contracts
    contract_info: {
        contract_type,
        exit_tick_time,
        is_sold,
        status,
        profit,
    },
}) => {
    /** @type {CanvasRenderingContext2D} */
    const ctx = context;

    const color = get_color({ status, profit });

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    const draw_start_line = is_last_contract && start.visible && !is_sold;
    if (draw_start_line) {
        render_label({
            ctx,
            text: 'Start\nTime',
            tick: { ...start, top: 100 },
        });
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(start.left, 0);
        ctx.lineTo(start.left, ctx.canvas.height);
        ctx.stroke();
    }
    // vertical line from date start to barrier
    if (!draw_start_line && barrier && entry && start.visible && barrier !== entry.top) {
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(start.left, barrier);
        ctx.lineTo(start.left, entry.top);
        ctx.stroke();
    }
    // barrier line
    if ((start.visible || expiry.visible) && barrier) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(start.left, barrier);
        ctx.lineTo(expiry.left, barrier);
        ctx.stroke();
    }
    // start-time marker
    if (start.visible && entry) {
        draw_path(ctx, {
            top : entry.top,
            left: start.left,
            zoom: start.zoom,
            icon: ICONS[contract_type].with_color(color),
        });
    }
    // status marker
    if (expiry.visible && is_sold) {
        draw_path(ctx, {
            top : barrier,
            left: expiry.left,
            zoom: expiry.zoom,
            icon: (ICONS[status.toUpperCase()] || ICONS.LOST),
        });
    }
    ctx.restore();
});

const DigitContract = RawMarkerMaker(({
    ctx: context,
    points: [start, ...ticks],
    is_last_contract,
    contract_info: {
        contract_type,
        status,
        profit,
        is_sold,
        barrier,
        tick_stream,
        tick_count,
    },
}) => {
    /** @type {CanvasRenderingContext2D} */
    const ctx = context;

    const color = get_color({ status, profit: is_sold ? profit : null });

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    const draw_start_line = is_last_contract && start.visible && !is_sold;

    if (draw_start_line) {
        let title = contract_type.replace('DIGIT', '').toLowerCase();
        if (barrier) {
            title = `${title} ${barrier}`;
        }
        render_label({
            ctx,
            text: title,
            tick: { ...start, top: 100 },
        });
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(start.left, 0);
        ctx.lineTo(start.left, ctx.canvas.height);
        ctx.stroke();
    }

    if (!ticks.length) {
        ctx.restore();
        return;
    }
    const entry = ticks[0];
    const expiry = ticks[ticks.length - 1];

    const scale = calc_scale(entry.zoom);
    // remaining ticks
    if (expiry.visible) {
        for (let i = 0; i <= tick_count - ticks.length; ++i) {
            const left = expiry.left + 8 * i * scale;
            if (left < entry.max_left) {
                ctx.beginPath();
                ctx.arc(left, entry.top, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // barrier line
    if (start.visible || entry.visible || expiry.visible) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(start.left, entry.top);
        ctx.lineTo(expiry.left, entry.top);
        ctx.stroke();
    }
    // start-time marker
    if (start.visible) {
        draw_path(ctx, {
            top : entry.top,
            left: start.left,
            zoom: start.zoom,
            icon: ICONS[contract_type].with_color(color),
        });
    }
    // date expiry marker
    if (expiry.visible && is_sold) {

        ctx.beginPath();
        ctx.arc(expiry.left, entry.top, 8 * scale, 0, Math.PI * 2);
        ctx.fill();

        const last_tick = tick_stream[tick_stream.length - 1];
        const last_digit = last_tick.tick_display_value.slice(-1);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = `bold ${12 * scale}px Roboto`;
        ctx.fillText(last_digit, expiry.left, entry.top + 1 * scale);
    }
    ctx.restore();
});

export default {
    TickContract,
    NonTickContract,
    DigitContract,
};
