import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';

export default function expandableDescription(description: string, lines?: string) {
  if (!description) {
    return <div></div>;
  }

  return (
    <Accordion elevation={0}>
      <AccordionSummary aria-controls="panel1-content" id="panel1-header">
        <Typography
          sx={{
            fontSize: 'small',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: lines ?? '1',
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{description}</AccordionDetails>
    </Accordion>
  );
}
