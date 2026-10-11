const dayjs = require('dayjs');

const calculateCost = (room, start, end) => {
  if (!room || room.pricing_type === 'FREE') {
    return { totalCost: 0, note: null };
  }

  const startTime = dayjs(start);
  const endTime = dayjs(end);
  const diffMinutes = endTime.diff(startTime, 'minute');
  
  // Round up to next 30 mins, then convert to hours
  const roundedMins = Math.ceil(diffMinutes / 30) * 30;
  const hours = roundedMins / 60;

  // Assuming a one-day meeting = 1 day (any overlap into a calendar day could count, but simplest is 1 day minimum)
  // For simplicity, if it's within the same day or <= 24h it's 1 day. If they span midnight, could be 2 days.
  let days = 1;
  if (!startTime.isSame(endTime, 'day')) {
      days = endTime.diff(startTime.startOf('day'), 'day') + 1;
  }

  const pricePerHour = Number(room.price_per_hour || 0);
  const pricePerDay = Number(room.price_per_day || 0);

  if (room.pricing_type === 'HOURLY') {
    const cost = hours * pricePerHour;
    return { 
        totalCost: Number(cost.toFixed(2)), 
        note: `${hours} hours x ${pricePerHour} ${room.currency}` 
    };
  }

  if (room.pricing_type === 'DAILY') {
    const cost = days * pricePerDay;
    return { 
        totalCost: Number(cost.toFixed(2)), 
        note: `${days} days x ${pricePerDay} ${room.currency}` 
    };
  }

  if (room.pricing_type === 'BOTH') {
    const hourlyCost = hours * pricePerHour;
    const dailyCost = days * pricePerDay;
    if (hourlyCost <= dailyCost) {
        return { 
            totalCost: Number(hourlyCost.toFixed(2)), 
            note: `${hours} hours x ${pricePerHour} ${room.currency}` 
        };
    } else {
        return { 
            totalCost: Number(dailyCost.toFixed(2)), 
            note: `Capped at daily rate: ${pricePerDay} ${room.currency}` 
        };
    }
  }

  return { totalCost: 0, note: null };
};

module.exports = { calculateCost };
