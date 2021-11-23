import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Events() {
  const { data, error } = useSWR("/api/events", fetcher);

  console.log(data);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {data.map((evt) => (
        <div key={evt.id}>
          <pre>{evt.body}</pre>
        </div>
      ))}
    </div>
  );
}
